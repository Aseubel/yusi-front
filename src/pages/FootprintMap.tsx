import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ChevronLeft, Loader2, Map, List, Filter, Compass, AlertCircle, Sparkles, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { getFootprints, type DiaryFootprint } from '../lib/diary'
import '../styles/footprint-map.css'

type LngLatTuple = [number, number]

type AMapPixel = {
    x?: number
    y?: number
}

type AMapMarker = {
    on: (event: 'click', handler: () => void) => void
    setMap: (map: AMapMap | null) => void
}

type AMapMap = {
    destroy: () => void
    setFitView: (markers: AMapMarker[], immediately?: boolean, margins?: [number, number, number, number]) => void
    setCenter: (position: LngLatTuple) => void
    setZoom: (zoom: number) => void
}

type AMapSDK = {
    Map: new (container: HTMLDivElement, options: {
        zoom: number
        center: LngLatTuple
        mapStyle: string
        viewMode: '2D' | '3D'
    }) => AMapMap
    Marker: new (options: {
        position: LngLatTuple
        title: string
        content: string
        offset: AMapPixel
    }) => AMapMarker
    Pixel: new (x: number, y: number) => AMapPixel
}

declare global {
    interface Window {
        AMap?: AMapSDK
        _AMapSecurityConfig: {
            securityJsCode?: string
            serviceHost?: string
        }
        _initAMap?: () => void
    }
}

// 加载高德地图 SDK（使用安全代理方式）
const loadAMapSDK = (): Promise<AMapSDK> => {
    return new Promise((resolve, reject) => {
        if (window.AMap) {
            resolve(window.AMap)
            return
        }

        // 配置安全代理（推荐方式，不暴露安全密钥）
        // Nginx 会在 /_AMapService/ 路径下自动附加 jscode 参数
        window._AMapSecurityConfig = {
            serviceHost: '/_AMapService'
        }

        const script = document.createElement('script')
        // 使用占位符，部署时由 entrypoint.sh 替换为实际 key
        // 开发环境优先读取 VITE_AMAP_JS_KEY
        const amapKey = import.meta.env.VITE_AMAP_JS_KEY || '__AMAP_JS_KEY__'
        if (!amapKey || amapKey === '__AMAP_JS_KEY__') {
            reject(new Error('AMAP_JS_KEY_MISSING'))
            return
        }
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&callback=_initAMap`
        script.async = true

        window._initAMap = () => {
            if (window.AMap) {
                resolve(window.AMap)
            } else {
                reject(new Error('Failed to load AMap SDK'))
            }
            delete window._initAMap
        }

        script.onerror = () => reject(new Error('Failed to load AMap SDK'))
        document.head.appendChild(script)
    })
}

// 中国中心坐标（无足迹时的默认中心）
const CHINA_CENTER: LngLatTuple = [104.065735, 35.738029]

export default function FootprintMap() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isLoggedIn = !!user
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<AMapMap | null>(null)
    const markersRef = useRef<AMapMarker[]>([])

    const [footprints, setFootprints] = useState<DiaryFootprint[]>([])
    const [loading, setLoading] = useState(true)
    const [mapLoading, setMapLoading] = useState(true)
    const [mapError, setMapError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
    const [selectedFootprint, setSelectedFootprint] = useState<DiaryFootprint | null>(null)
    const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')

    // 加载足迹数据
    const loadFootprints = useCallback(async () => {
        if (!user?.userId) return
        setLoading(true)
        try {
            const data = await getFootprints(user.userId)
            setFootprints(data)
        } catch (e) {
            console.error('Failed to load footprints:', e)
            toast.error('加载足迹失败')
        } finally {
            setLoading(false)
        }
    }, [user?.userId])

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login')
            return
        }
        loadFootprints()
    }, [isLoggedIn, navigate, loadFootprints])

    // 初始化地图
    useEffect(() => {
        if (viewMode !== 'map' || !mapContainerRef.current) return

        const initMap = async () => {
            setMapLoading(true)
            setMapError(null)
            try {
                const AMap = await loadAMapSDK()

                // 清除旧地图实例
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.destroy()
                }

                const container = mapContainerRef.current
                if (!container) {
                    setMapLoading(false)
                    return
                }

                // 过滤有效的坐标点
                const validPoints = footprints.filter(fp => 
                    Number.isFinite(fp.longitude) && Number.isFinite(fp.latitude)
                )

                // 确定地图中心：有足迹用第一个足迹，无足迹用中国中心
                const defaultCenter = validPoints.length > 0 
                    ? [validPoints[0].longitude, validPoints[0].latitude] as LngLatTuple
                    : CHINA_CENTER

                const map = new AMap.Map(container, {
                    zoom: validPoints.length > 0 ? 12 : 4,
                    center: defaultCenter,
                    mapStyle: 'amap://styles/dark',
                    viewMode: '2D'
                })

                mapInstanceRef.current = map

                // 清除旧标记
                markersRef.current.forEach(m => m.setMap(null))
                markersRef.current = []

                // 无有效足迹时，地图已初始化但不需要添加标记
                if (validPoints.length === 0) {
                    setMapLoading(false)
                    return
                }

                // 添加足迹标记
                const bounds: LngLatTuple[] = []
                validPoints.forEach((fp, index) => {
                    const marker = new AMap.Marker({
                        position: [fp.longitude, fp.latitude],
                        title: fp.placeName || fp.address || '足迹',
                        content: `
                            <div class="footprint-marker ${selectedFootprint?.diaryId === fp.diaryId ? 'selected' : ''}" 
                                style="--index: ${index}">
                                <div class="marker-dot"></div>
                                <div class="marker-pulse"></div>
                            </div>
                        `,
                        offset: new AMap.Pixel(-12, -12)
                    })

                    marker.on('click', () => {
                        setSelectedFootprint(fp)
                    })

                    marker.setMap(map)
                    markersRef.current.push(marker)
                    bounds.push([fp.longitude, fp.latitude])
                })

                // 自动调整视野包含所有标记
                if (bounds.length > 1) {
                    map.setFitView(markersRef.current, false, [50, 50, 50, 50])
                }

                setMapLoading(false)
            } catch (e) {
                console.error('Map init failed:', e)
                if (e instanceof Error && e.message === 'AMAP_JS_KEY_MISSING') {
                    setMapError('地图服务未配置，请联系管理员')
                } else {
                    setMapError('地图加载失败，请稍后重试')
                }
                setMapLoading(false)
            }
        }

        initMap()

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy()
                mapInstanceRef.current = null
            }
        }
    }, [viewMode, footprints, selectedFootprint])

    // 时间过滤
    const filteredFootprints = footprints.filter(fp => {
        if (timeFilter === 'all') return true
        const date = new Date(fp.createTime)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const dayMs = 24 * 60 * 60 * 1000

        switch (timeFilter) {
            case 'week': return diff <= 7 * dayMs
            case 'month': return diff <= 30 * dayMs
            case 'year': return diff <= 365 * dayMs
            default: return true
        }
    })

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    if (!isLoggedIn) return null

    return (
        <div className="footprint-map-container">
            {/* Header */}
            <header className="footprint-header">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1>足迹地图</h1>
                <div className="header-actions">
                    <Button
                        variant={viewMode === 'map' ? 'primary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('map')}
                    >
                        <Map className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'primary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="stats-bar">
                <div className="stat">
                    <MapPin className="w-4 h-4" />
                    <span>{filteredFootprints.length} 个足迹</span>
                </div>
                <div className="filter-group">
                    <Filter className="w-4 h-4" />
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
                        className="time-filter"
                    >
                        <option value="all">全部时间</option>
                        <option value="week">近一周</option>
                        <option value="month">近一月</option>
                        <option value="year">近一年</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="footprint-content">
                {loading ? (
                    <div className="loading-state">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                            <Compass className="w-10 h-10 text-primary" />
                        </motion.div>
                        <p>正在探索你的足迹...</p>
                    </div>
                ) : viewMode === 'map' ? (
                    <>
                        <div ref={mapContainerRef} className="map-container">
                            {mapLoading && (
                                <div className="map-loading">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Compass className="w-8 h-8 text-primary" />
                                    </motion.div>
                                </div>
                            )}
                            
                            {/* 地图错误状态 */}
                            {mapError && (
                                <div className="map-error-overlay">
                                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">地图加载失败</h3>
                                    <p className="text-muted-foreground text-sm mb-4">{mapError}</p>
                                    <Button variant="outline" onClick={() => setViewMode('list')}>
                                        切换到列表视图
                                    </Button>
                                </div>
                            )}

                            {/* 无足迹时的引导状态 */}
                            {!mapLoading && !mapError && filteredFootprints.length === 0 && (
                                <div className="map-empty-overlay">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-center"
                                    >
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                            <Navigation className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">暂无足迹记录</h3>
                                        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                                            在日记中添加位置信息，开始记录你的足迹吧
                                        </p>
                                        <Button onClick={() => navigate('/diary')} className="gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            写日记
                                        </Button>
                                    </motion.div>
                                </div>
                            )}
                        </div>

                        {/* Selected Footprint Detail */}
                        <AnimatePresence>
                            {selectedFootprint && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className="footprint-detail-card"
                                >
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                {selectedFootprint.placeName || '足迹'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {selectedFootprint.address}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(selectedFootprint.createTime)}</span>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedFootprint(null)}
                                                >
                                                    关闭
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => navigate(`/diary?id=${selectedFootprint.diaryId}`)}
                                                >
                                                    查看日记
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    /* List View */
                    <div className="footprint-list">
                        {filteredFootprints.length === 0 ? (
                            <div className="list-empty-state">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                                    <MapPin className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">暂无足迹</h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    在日记中添加位置信息，开始记录你的足迹吧
                                </p>
                                <Button onClick={() => navigate('/diary')}>写日记</Button>
                            </div>
                        ) : (
                            filteredFootprints.map((fp, index) => (
                                <motion.div
                                    key={fp.diaryId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="footprint-list-item"
                                    onClick={() => navigate(`/diary?id=${fp.diaryId}`)}
                                >
                                    <div className="item-icon">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="item-content">
                                        <h4>{fp.placeName || '足迹'}</h4>
                                        <p>{fp.address}</p>
                                        <span className="item-date">{formatDate(fp.createTime)}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

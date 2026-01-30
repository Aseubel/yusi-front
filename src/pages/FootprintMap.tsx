import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ChevronLeft, Loader2, Map, List, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { getFootprints, type DiaryFootprint } from '../lib/diary'
import '../styles/footprint-map.css'

declare global {
    interface Window {
        AMap: any
        _AMapSecurityConfig: { securityJsCode: string }
        _initAMap?: () => void
    }
}

// 加载高德地图 SDK
const loadAMapSDK = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (window.AMap) {
            resolve(window.AMap)
            return
        }

        const script = document.createElement('script')
        // 使用占位符，部署时由 entrypoint.sh 替换为实际 key
        const amapKey = '__AMAP_JS_KEY__'
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&callback=_initAMap`
        script.async = true

        window._initAMap = () => {
            resolve(window.AMap)
            delete (window as any)._initAMap
        }

        script.onerror = () => reject(new Error('Failed to load AMap SDK'))
        document.head.appendChild(script)
    })
}

export default function FootprintMap() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isLoggedIn = !!user
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])

    const [footprints, setFootprints] = useState<DiaryFootprint[]>([])
    const [loading, setLoading] = useState(true)
    const [mapLoading, setMapLoading] = useState(true)
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
        if (viewMode !== 'map' || !mapContainerRef.current || footprints.length === 0) return

        const initMap = async () => {
            setMapLoading(true)
            try {
                const AMap = await loadAMapSDK()

                // 清除旧地图实例
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.destroy()
                }

                // 创建地图
                const map = new AMap.Map(mapContainerRef.current, {
                    zoom: 12,
                    center: [footprints[0].longitude, footprints[0].latitude],
                    mapStyle: 'amap://styles/dark',
                    viewMode: '2D'
                })

                mapInstanceRef.current = map

                // 清除旧标记
                markersRef.current.forEach(m => m.setMap(null))
                markersRef.current = []

                // 添加足迹标记
                const bounds: [number, number][] = []
                footprints.forEach((fp, index) => {
                    const marker = new AMap.Marker({
                        position: [fp.longitude, fp.latitude],
                        title: fp.placeName || fp.address || '足迹',
                        content: `
              <div class="footprint-marker ${selectedFootprint?.diaryId === fp.diaryId ? 'selected' : ''}" 
                   style="--index: ${index}">
                <div class="marker-dot"></div>
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
                toast.error('地图加载失败')
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
                        onChange={(e) => setTimeFilter(e.target.value as any)}
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
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p>加载足迹数据...</p>
                    </div>
                ) : filteredFootprints.length === 0 ? (
                    <div className="empty-state">
                        <MapPin className="w-12 h-12 opacity-30" />
                        <h3>暂无足迹</h3>
                        <p>在日记中添加位置信息，开始记录你的足迹吧</p>
                        <Button onClick={() => navigate('/diary')}>写日记</Button>
                    </div>
                ) : viewMode === 'map' ? (
                    <>
                        <div ref={mapContainerRef} className="map-container">
                            {mapLoading && (
                                <div className="map-loading">
                                    <Loader2 className="w-6 h-6 animate-spin" />
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
                        {filteredFootprints.map((fp, index) => (
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Input, Card } from './ui'
import { MapPin, X, Star, Home, Briefcase, Heart, ChevronDown, ChevronUp, Loader2, Search, Compass } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
    type GeoLocation,
    type UserLocation,
    getUserLocations,
    getCurrentPosition
} from '../lib/location'
import { searchPOI, reverseGeocode, type POIResult } from '../lib/amap'
import { useAuthStore } from '../store/authStore'

interface LocationPickerProps {
    value?: GeoLocation | null
    onChange: (location: GeoLocation | null) => void
    className?: string
}

const LOCATION_ICONS: Record<string, React.ElementType> = {
    home: Home,
    work: Briefcase,
    heart: Heart,
    star: Star,
    location: MapPin
}

// 动画配置
const panelVariants = {
    hidden: { 
        opacity: 0, 
        y: -10,
        scale: 0.95 
    },
    visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: { 
            type: 'spring' as const,
            stiffness: 300,
            damping: 25 
        }
    },
    exit: { 
        opacity: 0, 
        y: -10,
        scale: 0.95,
        transition: { duration: 0.15 }
    }
} as const

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({ 
        opacity: 1, 
        x: 0,
        transition: { delay: i * 0.05 }
    })
}

export const LocationPicker = ({ value, onChange, className = '' }: LocationPickerProps) => {
    const { user } = useAuthStore()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [savedLocations, setSavedLocations] = useState<UserLocation[]>([])
    const [loadingSaved, setLoadingSaved] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<POIResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Load saved locations
    const loadSavedLocations = useCallback(async () => {
        if (!user?.userId) return
        setLoadingSaved(true)
        try {
            const locations = await getUserLocations(user.userId)
            setSavedLocations(locations)
        } catch (e) {
            console.error('Failed to load saved locations', e)
        } finally {
            setLoadingSaved(false)
        }
    }, [user?.userId])

    useEffect(() => {
        if (isExpanded && savedLocations.length === 0) {
            loadSavedLocations()
        }
    }, [isExpanded, savedLocations.length, loadSavedLocations])

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false)
            }
        }
        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isExpanded])

    // Debounced POI search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true)
            try {
                const results = await searchPOI(searchQuery)
                setSearchResults(results)
            } catch (e) {
                console.error('POI search failed:', e)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery])

    // Get current location using browser API + Amap reverse geocode
    const handleAutoLocate = async () => {
        setIsLocating(true)
        try {
            const position = await getCurrentPosition()
            const { latitude, longitude } = position.coords

            // Use backend proxy for reverse geocoding
            try {
                const geocodeResult = await reverseGeocode(latitude, longitude)
                if (geocodeResult) {
                    onChange({
                        latitude,
                        longitude,
                        address: geocodeResult.address,
                        placeName: geocodeResult.district || '当前位置'
                    })
                    toast.success('定位成功')
                } else {
                    // Fallback if reverse geocoding fails
                    onChange({
                        latitude,
                        longitude,
                        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                        placeName: '当前位置'
                    })
                    toast.success('定位成功（地址解析失败）')
                }
            } catch {
                // Fallback if reverse geocoding fails
                onChange({
                    latitude,
                    longitude,
                    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    placeName: '当前位置'
                })
                toast.success('定位成功（地址解析失败）')
            }
            setIsExpanded(false)
        } catch (err) {
            console.error('Geolocation error:', err)
            if (err instanceof GeolocationPositionError) {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        toast.error('请允许浏览器获取您的位置')
                        break
                    case err.POSITION_UNAVAILABLE:
                        toast.error('无法获取位置信息')
                        break
                    case err.TIMEOUT:
                        toast.error('定位超时，请重试')
                        break
                }
            } else {
                toast.error('定位失败，请手动搜索')
            }
        } finally {
            setIsLocating(false)
        }
    }

    // Select a POI from search results
    const handleSelectPOI = (poi: POIResult) => {
        onChange({
            latitude: poi.latitude,
            longitude: poi.longitude,
            address: poi.address,
            placeName: poi.name,
            placeId: poi.id
        })
        setSearchQuery('')
        setSearchResults([])
        setIsExpanded(false)
    }

    // Select a saved location
    const handleSelectSaved = (location: UserLocation) => {
        onChange({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            placeName: location.name,
            placeId: location.placeId
        })
        setIsExpanded(false)
    }

    // Clear location
    const handleClear = () => {
        onChange(null)
    }

    const getIconComponent = (iconName: string) => {
        return LOCATION_ICONS[iconName] || MapPin
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Current Selection Display */}
            {value ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl"
                >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                            {value.placeName || value.address || '已选择位置'}
                        </div>
                        {value.address && value.placeName !== value.address && (
                            <div className="text-xs text-muted-foreground truncate">
                                {value.address}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 hover:bg-primary/10"
                        onClick={handleClear}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </motion.div>
            ) : (
                <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground group"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <MapPin className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                    <span className="group-hover:text-foreground transition-colors">添加位置</span>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 ml-auto" />
                    ) : (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                    )}
                </Button>
            )}

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && !value && (
                    <motion.div
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute z-[9999] top-full mt-2 left-0 right-0 overflow-hidden"
                    >
                        <Card className="p-4 shadow-2xl border border-border/50 bg-background/95 backdrop-blur-xl">
                            <div className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="搜索地点..."
                                        className="pl-9 pr-4 bg-background/50"
                                        autoFocus
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>

                                {/* Search Results */}
                                <AnimatePresence mode="wait">
                                    {searchResults.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-y-auto space-y-1 max-h-[180px] border-t border-border/50 pt-3"
                                        >
                                            {searchResults.map((poi, i) => (
                                                <motion.button
                                                    key={poi.id}
                                                    custom={i}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="flex items-start gap-3 p-2.5 w-full text-left rounded-lg hover:bg-primary/10 transition-colors group"
                                                    onClick={() => handleSelectPOI(poi)}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">{poi.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">{poi.address}</div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Auto Location */}
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                                    onClick={handleAutoLocate}
                                    disabled={isLocating}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        isLocating 
                                            ? 'bg-primary/10' 
                                            : 'bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:from-primary/30 group-hover:to-purple-500/30'
                                    }`}>
                                        {isLocating ? (
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        ) : (
                                            <Compass className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                            获取当前位置
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            使用 GPS 定位
                                        </div>
                                    </div>
                                </motion.button>

                                {/* Saved Locations */}
                                {savedLocations.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="space-y-2"
                                    >
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">常用地点</div>
                                        <div className="grid gap-1.5 max-h-28 overflow-y-auto">
                                            {savedLocations.map((loc, i) => {
                                                const IconComponent = getIconComponent(loc.icon)
                                                return (
                                                    <motion.button
                                                        key={loc.locationId}
                                                        custom={i}
                                                        variants={itemVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        className="flex items-center gap-3 p-2.5 text-sm text-left rounded-lg hover:bg-primary/10 transition-colors group"
                                                        onClick={() => handleSelectSaved(loc)}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                            <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <span className="truncate flex-1 group-hover:text-primary transition-colors">{loc.name}</span>
                                                        {loc.locationType === 'IMPORTANT' && (
                                                            <Heart className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 fill-rose-400" />
                                                        )}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {loadingSaved && (
                                    <div className="flex items-center justify-center py-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                )}

                                {/* Close */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    取消
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

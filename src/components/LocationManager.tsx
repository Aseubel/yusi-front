import { useState, useEffect, useCallback } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from './ui'
import { MapPin, Plus, Trash2, Edit2, Home, Briefcase, Heart, Star, Loader2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
    type UserLocation,
    getUserLocations,
    addUserLocation,
    updateUserLocation,
    deleteUserLocation
} from '../lib/location'
import { searchPOI, type POIResult } from '../lib/amap'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from 'react-i18next'

const ICON_OPTIONS = [
    { value: 'home', icon: Home },
    { value: 'work', icon: Briefcase },
    { value: 'heart', icon: Heart },
    { value: 'star', icon: Star },
    { value: 'location', icon: MapPin }
]

const TYPE_OPTIONS = [
    { value: 'FREQUENT' },
    { value: 'IMPORTANT' }
]

interface LocationFormData {
    name: string
    address: string
    latitude: number
    longitude: number
    placeId?: string
    icon: string
    locationType: 'FREQUENT' | 'IMPORTANT'
}

export const LocationManager = () => {
    const { t } = useTranslation()
    const { user } = useAuthStore()
    const userId = user?.userId
    const [locations, setLocations] = useState<UserLocation[]>([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState<LocationFormData>({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        icon: 'location',
        locationType: 'FREQUENT'
    })

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<POIResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const loadLocations = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        try {
            const list = await getUserLocations(userId)
            setLocations(list)
        } catch (e) {
            console.error('Failed to load locations', e)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadLocations()
        }, 0)
        return () => clearTimeout(timer)
    }, [loadLocations])

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            const timer = setTimeout(() => setSearchResults([]), 0)
            return () => clearTimeout(timer)
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const results = await searchPOI(searchQuery)
                setSearchResults(results)
            } catch {
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSelectPOI = (poi: POIResult) => {
        setFormData(prev => ({
            ...prev,
            name: prev.name || poi.name,
            address: poi.address,
            latitude: poi.latitude,
            longitude: poi.longitude,
            placeId: poi.id
        }))
        setSearchQuery('')
        setSearchResults([])
    }

    const handleSubmit = async () => {
        if (!user?.userId) return
        if (!formData.name.trim()) {
            toast.error(t('location.errors.nameRequired'))
            return
        }
        if (!formData.latitude || !formData.longitude) {
            toast.error(t('location.errors.selectRequired'))
            return
        }

        setSaving(true)
        try {
            if (editingId) {
                await updateUserLocation({
                    userId: user.userId,
                    locationId: editingId,
                    ...formData
                })
                toast.success(t('location.toast.updated'))
            } else {
                await addUserLocation({
                    userId: user.userId,
                    ...formData
                })
                toast.success(t('location.toast.added'))
            }
            resetForm()
            loadLocations()
        } catch {
            toast.error(t('location.errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (location: UserLocation) => {
        setEditingId(location.locationId)
        setFormData({
            name: location.name,
            address: location.address || '',
            latitude: location.latitude,
            longitude: location.longitude,
            placeId: location.placeId,
            icon: location.icon,
            locationType: location.locationType
        })
        setShowForm(true)
    }

    const handleDelete = async (locationId: string) => {
        if (!user?.userId) return
        setDeleting(locationId)
        try {
            await deleteUserLocation(user.userId, locationId)
            toast.success(t('location.toast.deleted'))
            loadLocations()
        } catch {
            toast.error(t('location.errors.deleteFailed'))
        } finally {
            setDeleting(null)
        }
    }

    const resetForm = () => {
        setShowForm(false)
        setEditingId(null)
        setFormData({
            name: '',
            address: '',
            latitude: 0,
            longitude: 0,
            icon: 'location',
            locationType: 'FREQUENT'
        })
        setSearchQuery('')
        setSearchResults([])
    }

    const getIconComponent = (iconName: string) => {
        const found = ICON_OPTIONS.find(o => o.value === iconName)
        return found?.icon || MapPin
    }

    return (
        <Card>
            <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    {t('location.title')}
                </CardTitle>
                {!showForm && (
                    <Button size="sm" onClick={() => setShowForm(true)} className="min-h-11 w-full sm:min-h-9 sm:w-auto">
                        <Plus className="w-4 h-4 mr-1" />
                        {t('location.add')}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add/Edit Form */}
                {showForm && (
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{editingId ? t('location.edit') : t('location.add')}</span>
                            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={resetForm} aria-label={t('common.close')}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('location.searchLabel')}</label>
                            <div className="relative">
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('location.searchPlaceholder')}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                                )}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="border rounded-md max-h-40 overflow-y-auto">
                                    {searchResults.map(poi => (
                                        <button
                                            type="button"
                                            key={poi.id}
                                            className="flex min-h-12 w-full items-start gap-2 border-b p-2 text-left hover:bg-muted/50 last:border-0"
                                            onClick={() => handleSelectPOI(poi)}
                                        >
                                            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium truncate">{poi.name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{poi.address}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected location display */}
                        {formData.latitude !== 0 && (
                            <div className="p-2 bg-primary/5 border border-primary/20 rounded-md text-sm">
                                <div className="font-medium">{formData.address || t('location.selected')}</div>
                                <div className="text-xs text-muted-foreground">
                                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                </div>
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">{t('location.customName')}</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('location.customNamePlaceholder')}
                            />
                        </div>

                        {/* Icon & Type */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">{t('location.icon')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICON_OPTIONS.map(opt => {
                                        const Icon = opt.icon
                                        return (
                                            <button
                                                type="button"
                                                key={opt.value}
                                                className={`flex h-11 w-11 items-center justify-center rounded-md border transition-colors sm:h-10 sm:w-10 ${formData.icon === opt.value
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-border hover:bg-muted'
                                                    }`}
                                                onClick={() => setFormData(prev => ({ ...prev, icon: opt.value }))}
                                                title={t(`location.icons.${opt.value === 'heart' ? 'important' : opt.value === 'star' ? 'favorite' : opt.value}`)}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">{t('location.type')}</label>
                                <div className="flex gap-2">
                                    {TYPE_OPTIONS.map(opt => (
                                        <button
                                            type="button"
                                            key={opt.value}
                                            className={`min-h-11 flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors sm:min-h-10 ${formData.locationType === opt.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:bg-muted'
                                                }`}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                locationType: opt.value as 'FREQUENT' | 'IMPORTANT'
                                            }))}
                                        >
                                            {t(`location.types.${opt.value === 'FREQUENT' ? 'frequent' : 'important'}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                            <Button variant="outline" onClick={resetForm} className="min-h-11 flex-1 sm:min-h-10">
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handleSubmit} disabled={saving} className="min-h-11 flex-1 sm:min-h-10">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                                {editingId ? t('location.update') : t('common.save')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Location List */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : locations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>{t('location.empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {locations.map(loc => {
                            const Icon = getIconComponent(loc.icon)
                            return (
                                <div
                                    key={loc.locationId}
                                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                                >
                                    <div className={`p-2 rounded-lg ${loc.locationType === 'IMPORTANT'
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium flex items-center gap-2">
                                            {loc.name}
                                            {loc.locationType === 'IMPORTANT' && (
                                                <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {loc.address}
                                        </div>
                                    </div>
                                    <div className="ml-auto flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 sm:h-10 sm:w-10"
                                            onClick={() => handleEdit(loc)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-destructive hover:text-destructive sm:h-10 sm:w-10"
                                            onClick={() => handleDelete(loc.locationId)}
                                            disabled={deleting === loc.locationId}
                                        >
                                            {deleting === loc.locationId ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, ImageUp, FileText, ExternalLink, Trash2, Eye, X, Pencil, Smartphone, ChevronLeft, Heart, MoreHorizontal, Star, Lock, Info, Store as StoreIcon, MessageCircle, Wifi } from 'lucide-react';
import { fetchPartnerProfile, updatePartnerProfile } from '@/api/partnerProfile';
import { fetchOutlets } from '@/api/outlets';
import { fetchOutletBanners, createOutletBanner, updateOutletBanner, deleteOutletBanner } from '@/api/outletBanners';
import type { Outlet, OutletBanner, Partner } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { mediaUrl } from '@/lib/assets';

// ── color utilities ──────────────────────────────────────────────────────────

const normalizeHex = (v?: string | null): string | null => {
  if (!v) return null;
  const s = v.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return null;
  if (s.length === 4) {
    const [, r, g, b] = s;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return s.toLowerCase();
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;

const hexToRgb = (hex: string) => {
  const n = normalizeHex(hex);
  if (!n) return null;
  return { r: parseInt(n.slice(1, 3), 16), g: parseInt(n.slice(3, 5), 16), b: parseInt(n.slice(5, 7), 16) };
};

const dedupeColors = (colors: Array<string | null | undefined>, limit = 6): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of colors) {
    const n = normalizeHex(c);
    if (n && !seen.has(n)) { seen.add(n); out.push(n); }
    if (out.length >= limit) break;
  }
  return out;
};

const mixHex = (a: string, b: string, w: number): string => {
  const ra = hexToRgb(a), rb = hexToRgb(b);
  if (!ra || !rb) return normalizeHex(a) ?? '#000000';
  const cw = Math.max(0, Math.min(1, w));
  return rgbToHex(ra.r + (rb.r - ra.r) * cw, ra.g + (rb.g - ra.g) * cw, ra.b + (rb.b - ra.b) * cw);
};

const extractColorsFromImage = async (file: File): Promise<string[]> => {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    const w = 72, h = Math.max(1, Math.round((img.height / img.width) * w));
    canvas.width = w; canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h).data;
    const counts = new Map<string, number>();
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] <= 32) continue;
      const key = rgbToHex(Math.round(pixels[i] / 32) * 32, Math.round(pixels[i + 1] / 32) * 32, Math.round(pixels[i + 2] / 32) * 32);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const p = sorted[0] ?? null;
    return dedupeColors([p, ...sorted, p ? mixHex(p, '#ffffff', 0.18) : null, p ? mixHex(p, '#000000', 0.12) : null, p ? mixHex(p, '#ffffff', 0.3) : null]);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const textOnBg = (bg?: string | null): string => {
  const rgb = hexToRgb(bg ?? '');
  if (!rgb) return '#ffffff';
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (r: typeof rgb) => 0.2126 * lin(r.r) + 0.7152 * lin(r.g) + 0.0722 * lin(r.b);
  const contrast = (a: string, b: string) => { const la = hexToRgb(a), lb = hexToRgb(b); if (!la || !lb) return 1; const [hi, lo] = [lum(la), lum(lb)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  return contrast(hex, '#ffffff') >= contrast(hex, '#111827') ? '#ffffff' : '#111827';
};

// ─────────────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  contact_email: z.string().email('Неверный email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Неверный URL').optional().or(z.literal('')),
  instagram_url: z.string().optional(),
  telegram_url: z.string().optional(),
  youtube_url: z.string().optional(),
  facebook_url: z.string().optional(),
  description_ru: z.string().optional(),
  description_uz: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const qc = useQueryClient();

  // logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [deleteLogo, setDeleteLogo] = useState(false);

  // menu state
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [deleteMenu, setDeleteMenu] = useState(false);

  // banner state
  const bannerPreviewRef = useRef<string | null>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<OutletBanner | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [bannerColor, setBannerColor] = useState('#cccccc');
  const [bannerActive, setBannerActive] = useState(true);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  // animation "visible" states — DOM stays mounted during close transition
  const [logoDialogVisible, setLogoDialogVisible] = useState(false);
  const [bannerFormVisible, setBannerFormVisible] = useState(false);
  const [mobilePreviewVisible, setMobilePreviewVisible] = useState(false);

  // lock body scroll while any overlay is open
  useEffect(() => {
    const anyOpen = logoDialogVisible || bannerFormVisible || mobilePreviewVisible;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [logoDialogVisible, bannerFormVisible, mobilePreviewVisible]);

  // profile query
  const { data: profile, isLoading, isError, refetch } = useQuery<Partner>({
    queryKey: ['partnerProfile'],
    queryFn: () => fetchPartnerProfile(),
  });

  // outlets + banners
  const { data: outlets = [] } = useQuery<Outlet[]>({
    queryKey: ['outlets'],
    queryFn: () => fetchOutlets({}),
  });
  const firstOutletId = outlets[0]?.id ?? null;
  const { data: banners = [] } = useQuery<OutletBanner[]>({
    queryKey: ['banners', firstOutletId],
    queryFn: () => fetchOutletBanners(firstOutletId!),
    enabled: firstOutletId !== null,
  });
  const currentBanner = banners.find((b) => b.applies_to_all_outlets) ?? banners[0] ?? null;

  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      form.reset({
        contact_email: profile.contact_email ?? '',
        contact_phone: profile.contact_phone ?? '',
        address: profile.address ?? '',
        website: profile.website ?? '',
        instagram_url: profile.instagram_url ?? '',
        telegram_url: profile.telegram_url ?? '',
        youtube_url: profile.youtube_url ?? '',
        facebook_url: profile.facebook_url ?? '',
        description_ru: profile.description_ru ?? profile.description ?? '',
        description_uz: profile.description_uz ?? '',
      });
    }
  }, [profile, form]);

  const mutation = useMutation({
    mutationFn: (v: ProfileFormValues) => updatePartnerProfile(
      {
        contact_email: v.contact_email || undefined,
        contact_phone: v.contact_phone || undefined,
        address: v.address || undefined,
        website: v.website || undefined,
        instagram_url: v.instagram_url || undefined,
        telegram_url: v.telegram_url || undefined,
        youtube_url: v.youtube_url || undefined,
        facebook_url: v.facebook_url || undefined,
        description_ru: v.description_ru || undefined,
        description_uz: v.description_uz || undefined,
      },
      { logo: logoFile ?? undefined, menu: menuFile ?? undefined },
    ),
    onSuccess: () => {
      toast.success('Профиль обновлён');
      qc.invalidateQueries({ queryKey: ['partnerProfile'] });
      setLogoFile(null); setMenuFile(null); setDeleteLogo(false); setDeleteMenu(false);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const bannerMutation = useMutation({
    mutationFn: async (payload: { background_color: string; is_active: boolean; image: File | null }) => {
      if (!firstOutletId) throw new Error('No outlet');
      const p = { background_color: normalizeHex(payload.background_color) ?? '', apply_to_all_outlets: true, is_active: payload.is_active, image: payload.image };
      if (editingBanner) return updateOutletBanner(firstOutletId, editingBanner.id, p);
      return createOutletBanner(firstOutletId, p);
    },
    onSuccess: () => {
      toast.success(editingBanner ? 'Баннер обновлён' : 'Баннер добавлен');
      qc.invalidateQueries({ queryKey: ['banners'] });
      closeBannerForm();
    },
    onError: () => toast.error('Ошибка сохранения баннера'),
  });

  const deleteBannerMutation = useMutation({
    mutationFn: () => deleteOutletBanner(firstOutletId!, currentBanner!.id, { apply_to_all_outlets: true }),
    onSuccess: () => { toast.success('Баннер удалён'); qc.invalidateQueries({ queryKey: ['banners'] }); },
    onError: () => toast.error('Ошибка удаления'),
  });

  const openLogoDialog = () => { setLogoDialogVisible(true); setTimeout(() => setLogoDialogOpen(true), 16); };
  const closeLogoDialog = () => { setLogoDialogOpen(false); setTimeout(() => setLogoDialogVisible(false), 220); };

  const openMobilePreview = () => { setMobilePreviewVisible(true); setTimeout(() => setMobilePreviewOpen(true), 16); };
  const closeMobilePreview = () => { setMobilePreviewOpen(false); setTimeout(() => setMobilePreviewVisible(false), 220); };

  const openBannerForm = (banner?: OutletBanner) => {
    setEditingBanner(banner ?? null);
    setBannerImageFile(null);
    setBannerPreviewUrl(banner?.image ?? null);
    const colors = dedupeColors([banner?.background_color, ...(banner?.suggested_background_colors ?? [])]);
    setSuggestedColors(colors);
    setBannerColor(normalizeHex(banner?.background_color) ?? '#cccccc');
    setBannerActive(banner?.is_active ?? true);
    setBannerFormVisible(true);
    setTimeout(() => setBannerFormOpen(true), 16);
  };

  const closeBannerForm = () => {
    setBannerFormOpen(false);
    setTimeout(() => {
      if (bannerPreviewRef.current) { URL.revokeObjectURL(bannerPreviewRef.current); bannerPreviewRef.current = null; }
      setBannerFormVisible(false);
      setEditingBanner(null);
      setBannerImageFile(null);
      setBannerPreviewUrl(null);
      setSuggestedColors([]);
    }, 220);
  };

  const handleBannerImageSelect = async (file: File) => {
    if (bannerPreviewRef.current) URL.revokeObjectURL(bannerPreviewRef.current);
    const url = URL.createObjectURL(file);
    bannerPreviewRef.current = url;
    setBannerImageFile(file);
    setBannerPreviewUrl(url);
    try {
      const colors = await extractColorsFromImage(file);
      setSuggestedColors(colors);
      if (colors[0]) setBannerColor(colors[0]);
    } catch { /* ignore */ }
  };

  const currentLogoUrl = deleteLogo ? null : logoFile ? URL.createObjectURL(logoFile) : mediaUrl(profile?.logo);
  const currentMenuUrl = deleteMenu ? null : mediaUrl(profile?.menu);
  const menuDisplayName = menuFile?.name ?? (profile?.menu && !deleteMenu ? profile.menu.split('/').pop() : null);
  const bannerBg = currentBanner?.background_color ?? '#e5e7eb';
  const previewTextColor = textOnBg(bannerColor);
  // mobile preview
  const mobileBg = bannerBg;
  const mobileTC = textOnBg(mobileBg);
  const mobileIsDark = mobileTC === '#ffffff';
  const mobilePillBg = mobileIsDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
  const mobileCardBg = mobileIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const mobileImgBg = mobileIsDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.8)';
  // iPhone 17 Pro Max: 430×932 screen + 12px border each side = 454×956 frame
  // Scale so phone exactly fills the viewport height
  const phoneScale = typeof window !== 'undefined' ? window.innerHeight / 956 : 0.94;

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Профиль" description="Информация о вашей компании" />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : profile ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">

            {/* Facebook-style hero: banner + logo overlay */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Banner */}
                <button
                  type="button"
                  onClick={() => openBannerForm(currentBanner ?? undefined)}
                  className="relative w-full group block"
                  style={{ aspectRatio: '16/5', background: bannerBg }}
                  title="Нажмите для управления баннером"
                >
                  {currentBanner?.image ? (
                    <img src={currentBanner.image} alt="Баннер" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/60">
                      <ImageUp className="h-7 w-7" />
                      <span className="text-sm">Добавить баннер</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 text-white text-sm font-medium">
                      <Pencil className="h-4 w-4" />
                      {currentBanner ? 'Изменить баннер' : 'Добавить баннер'}
                    </div>
                  </div>
                </button>

                {/* Info row: avatar pulled up to overlap banner, text fully below */}
                <div className="relative px-5 pb-4 pt-2 min-h-[52px]">
                  <button
                    type="button"
                    onClick={openLogoDialog}
                    className="absolute -top-9 left-5 group z-10"
                    title="Управление логотипом"
                  >
                    <Avatar className="h-[72px] w-[72px] ring-4 ring-background shadow-lg">
                      <AvatarImage src={currentLogoUrl ?? undefined} />
                      <AvatarFallback className="bg-muted"><Building2 className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  <div className="pl-[88px] flex items-center justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold leading-tight truncate">{profile.name}</h2>
                      <p className="text-sm text-muted-foreground truncate">{profile.slug}</p>
                      {logoFile && <p className="text-xs text-[#1A3F75] mt-0.5">{logoFile.name}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={openMobilePreview}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1A3F75]/10 text-[#1A3F75] hover:bg-[#1A3F75]/20 transition-colors"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      Мобильное отображение
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader><CardTitle>Контактная информация</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact_email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contact_phone" render={({ field }) => (
                    <FormItem><FormLabel>Телефон</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Адрес</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem className="sm:col-span-2"><FormLabel>Веб-сайт</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Social */}
            <Card>
              <CardHeader><CardTitle>Социальные сети</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['instagram_url', 'telegram_url', 'youtube_url', 'facebook_url'] as const).map((fieldName) => (
                  <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName.replace('_url', '').replace(/^\w/, (c) => c.toUpperCase())}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader><CardTitle>Описание</CardTitle></CardHeader>
              <CardContent>
                <Tabs defaultValue="ru">
                  <TabsList className="mb-3">
                    <TabsTrigger value="ru">RU</TabsTrigger>
                    <TabsTrigger value="uz">UZ</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ru">
                    <FormField control={form.control} name="description_ru" render={({ field }) => (
                      <FormItem><FormControl><Textarea rows={4} placeholder="Описание на русском" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </TabsContent>
                  <TabsContent value="uz">
                    <FormField control={form.control} name="description_uz" render={({ field }) => (
                      <FormItem><FormControl><Textarea rows={4} placeholder="O'zbek tilida tavsif" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Menu */}
            <Card>
              <CardHeader><CardTitle>Меню</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 flex-wrap">
                  {menuDisplayName && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm max-w-xs">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{menuDisplayName}</span>
                    </div>
                  )}
                  {currentMenuUrl && !menuFile && (
                    <Button type="button" size="sm" variant="outline" onClick={() => window.open(currentMenuUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-1" />Открыть
                    </Button>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-foreground bg-[#1A3F75] hover:bg-[#1D4A90] transition-colors shadow-sm select-none">
                    <ImageUp className="h-4 w-4" />
                    Загрузить
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { setMenuFile(e.target.files?.[0] ?? null); setDeleteMenu(false); }} />
                  </label>
                  {(currentMenuUrl || menuFile) && !deleteMenu && (
                    <Button type="button" size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => { setDeleteMenu(true); setMenuFile(null); }}>
                      <Trash2 className="h-4 w-4 mr-1" />Удалить
                    </Button>
                  )}
                  {!menuDisplayName && !deleteMenu && <p className="text-xs text-muted-foreground">PDF, JPG, PNG до 10 МБ</p>}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить изменения
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      {/* ── Logo lightbox ─────────────────────────────────────────────── */}
      {logoDialogVisible && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: logoDialogOpen ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
            backdropFilter: logoDialogOpen ? 'blur(12px)' : 'blur(0px)',
            transition: 'background 220ms ease-out, backdrop-filter 220ms ease-out',
          }}
          onClick={closeLogoDialog}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={closeLogoDialog}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="flex items-center justify-center"
            style={{
              width: '80vmin', height: '80vmin',
              transform: logoDialogOpen ? 'scale(1)' : 'scale(0.88)',
              opacity: logoDialogOpen ? 1 : 0,
              transition: 'transform 220ms cubic-bezier(0.34,1.56,0.64,1), opacity 200ms ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {currentLogoUrl ? (
              <img src={currentLogoUrl} alt="Логотип" className="w-full h-full object-contain rounded-3xl shadow-2xl" />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-3xl bg-white/10">
                <Building2 className="h-24 w-24 text-white/40" />
              </div>
            )}
          </div>
          <div
            className="flex gap-4 mt-8"
            style={{
              opacity: logoDialogOpen ? 1 : 0,
              transform: logoDialogOpen ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 220ms ease-out 60ms, transform 220ms ease-out 60ms',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <label className="cursor-pointer inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-base font-semibold text-white bg-[#1A3F75] hover:bg-[#1D4A90] transition-colors select-none shadow-lg">
              <ImageUp className="h-5 w-5" />Загрузить
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { setLogoFile(e.target.files?.[0] ?? null); setDeleteLogo(false); closeLogoDialog(); }} />
            </label>
            {currentLogoUrl && (
              <button type="button" className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-base font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                onClick={() => { setDeleteLogo(true); setLogoFile(null); closeLogoDialog(); }}>
                <Trash2 className="h-5 w-5" />Удалить
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile preview overlay ────────────────────────────── */}
      {mobilePreviewVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: mobilePreviewOpen ? 'rgba(0,0,0,0.80)' : 'rgba(0,0,0,0)',
            backdropFilter: mobilePreviewOpen ? 'blur(12px)' : 'blur(0px)',
            transition: 'background 220ms ease-out, backdrop-filter 220ms ease-out',
          }}
          onClick={closeMobilePreview}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            onClick={closeMobilePreview}
            style={{ opacity: mobilePreviewOpen ? 1 : 0, transition: 'opacity 200ms ease-out 80ms' }}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Scale wrapper — phone fills full viewport height */}
          <div
            className="relative"
            style={{
              transform: `scale(${mobilePreviewOpen ? phoneScale : phoneScale * 0.92})`,
              transformOrigin: 'top center',
              marginBottom: `${956 * ((mobilePreviewOpen ? phoneScale : phoneScale * 0.92) - 1)}px`,
              opacity: mobilePreviewOpen ? 1 : 0,
              transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease-out, margin-bottom 280ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mute/ring switch (left) */}
            <div className="absolute" style={{ left: -6, top: 136, width: 6, height: 30, background: '#1c1c1e', borderRadius: '4px 0 0 4px', boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.08)' }} />
            {/* Volume up (left) */}
            <div className="absolute" style={{ left: -6, top: 186, width: 6, height: 68, background: '#1c1c1e', borderRadius: '4px 0 0 4px', boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.08)' }} />
            {/* Volume down (left) */}
            <div className="absolute" style={{ left: -6, top: 270, width: 6, height: 68, background: '#1c1c1e', borderRadius: '4px 0 0 4px', boxShadow: 'inset -1px 0 2px rgba(255,255,255,0.08)' }} />
            {/* Power button (right) */}
            <div className="absolute" style={{ right: -6, top: 208, width: 6, height: 96, background: '#1c1c1e', borderRadius: '0 4px 4px 0', boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.08)' }} />

            {/* Phone body */}
            <div
              className="relative overflow-hidden"
              style={{
                width: 430,
                height: 932,
                borderRadius: 62,
                border: '12px solid #111',
                background: mobileBg,
                boxShadow: '0 0 0 1px #2e2e2e, inset 0 0 0 1px rgba(255,255,255,0.04), 0 50px 120px rgba(0,0,0,0.9)',
              }}
            >
              {/* Dynamic Island */}
              <div
                className="absolute z-30 pointer-events-none"
                style={{ top: 14, left: '50%', transform: 'translateX(-50%)', width: 128, height: 36, background: '#000', borderRadius: 22 }}
              />

              {/* Status bar around Dynamic Island */}
              <div
                className="absolute top-0 inset-x-0 z-20 flex items-center justify-between pointer-events-none"
                style={{ height: 60, paddingInline: 28 }}
              >
                <span className="text-[15px] font-semibold" style={{ color: mobileTC }}>9:41</span>
                <div className="flex items-center gap-1.5" style={{ color: mobileTC }}>
                  <Wifi className="h-[14px] w-[14px]" />
                  <span className="text-[12px] font-semibold">88%</span>
                </div>
              </div>

              {/* Scrollable content */}
              <div
                className="h-full overflow-y-auto"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {/* Banner */}
                <div className="relative" style={{ height: 360 }}>
                  {currentBanner?.image ? (
                    <img src={currentBanner.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: mobileBg }} />
                  )}
                  <div
                    className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
                    style={{ background: `linear-gradient(transparent, ${mobileBg})` }}
                  />
                  {/* Nav buttons below Dynamic Island */}
                  <div className="absolute inset-x-4 flex justify-between items-center" style={{ top: 72 }}>
                    <div className="h-[38px] w-[38px] rounded-full bg-white/65 backdrop-blur-sm flex items-center justify-center shadow-md">
                      <ChevronLeft className="h-5 w-5 text-gray-800" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-[38px] w-[38px] rounded-full bg-white/65 backdrop-blur-sm flex items-center justify-center shadow-md">
                        <Heart className="h-[16px] w-[16px] text-gray-800" />
                      </div>
                      <div className="h-[38px] w-[38px] rounded-full bg-white/65 backdrop-blur-sm flex items-center justify-center shadow-md">
                        <MoreHorizontal className="h-[16px] w-[16px] text-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo — iOS rounded square, centered */}
                <div className="flex justify-center -mt-11 relative z-10">
                  <div className="overflow-hidden shadow-2xl" style={{ width: 84, height: 84, borderRadius: 20, background: 'white' }}>
                    {currentLogoUrl ? (
                      <img src={currentLogoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Building2 className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + address */}
                <div className="px-6 pt-3 pb-4 text-center">
                  <h2 className="text-[22px] font-bold leading-tight" style={{ color: mobileTC }}>
                    {profile?.name ?? 'Название компании'}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    <span className="text-[14px]" style={{ color: mobileTC, opacity: 0.7 }}>
                      {outlets[0]?.address ?? 'Авиагородок-22, 2'}
                    </span>
                    <span style={{ color: mobileTC, opacity: 0.4 }}>•</span>
                    <Star className="h-3.5 w-3.5" style={{ fill: '#F59E0B', color: '#F59E0B' }} />
                    <span className="text-[14px] font-semibold" style={{ color: mobileTC, opacity: 0.85 }}>4.9</span>
                  </div>
                </div>

                {/* Pill buttons */}
                <div className="flex gap-2.5 px-5 pb-5">
                  {([
                    { icon: <Info className="h-[14px] w-[14px]" />, label: 'Инфо...' },
                    { icon: <StoreIcon className="h-[14px] w-[14px]" />, label: 'Фили...' },
                    { icon: <MessageCircle className="h-[14px] w-[14px]" />, label: 'Отзы...' },
                  ] as const).map(({ icon, label }) => (
                    <div key={label} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[14px] font-medium"
                      style={{ background: mobilePillBg, color: mobileTC }}>
                      {icon}{label}
                    </div>
                  ))}
                </div>

                {/* Separator */}
                <div className="mx-5 mb-4 h-px" style={{ background: mobileIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }} />

                {/* Deals */}
                <div className="px-5 pb-10">
                  <h3 className="text-[18px] font-bold mb-3" style={{ color: mobileTC }}>1+1 предложения</h3>
                  <div className="space-y-3">
                    {[
                      { title: '1 + 1 Акция', price: "100 000 soʼm dan", expire: '31.04.2026', locked: false },
                      { title: '1 + 1 Акция', price: "150 000 soʼm dan", expire: '31.04.2026', locked: true },
                    ].map((deal, i) => (
                      <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-2xl" style={{ background: mobileCardBg }}>
                        <div className="h-[74px] w-[74px] rounded-2xl flex items-center justify-center shrink-0" style={{ background: mobileImgBg, fontSize: 28 }}>
                          🍽️
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px]" style={{ color: mobileTC, opacity: 0.65 }}>{deal.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[15px] font-bold" style={{ color: mobileTC }}>{deal.price}</p>
                            <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-yellow-400 text-gray-900">1+1</span>
                          </div>
                          <p className="text-[12px] mt-0.5" style={{ color: mobileTC, opacity: 0.55 }}>Срок действия: {deal.expire}</p>
                        </div>
                        {deal.locked && <Lock className="h-[16px] w-[16px] shrink-0" style={{ color: mobileTC, opacity: 0.4 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-20">
                <div className="w-32 h-1 rounded-full" style={{ background: mobileIsDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Banner management fullscreen overlay ─────────────────────── */}
      {bannerFormVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: bannerFormOpen ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
            backdropFilter: bannerFormOpen ? 'blur(12px)' : 'blur(0px)',
            transition: 'background 220ms ease-out, backdrop-filter 220ms ease-out',
          }}
          onClick={closeBannerForm}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={closeBannerForm}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="flex flex-col sm:flex-row gap-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            style={{
              transform: bannerFormOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
              opacity: bannerFormOpen ? 1 : 0,
              transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: title + settings + buttons */}
            <div className="flex flex-col gap-4 sm:w-[45%]">
              <h2 className="text-2xl font-bold text-white">
                {editingBanner ? 'Редактировать баннер' : 'Добавить баннер'}
              </h2>

              {/* Color picker */}
              <div>
                <Label className="text-base font-medium text-white/80 mb-2 block">Цвет фона</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={normalizeHex(bannerColor) ?? '#cccccc'}
                    onChange={(e) => setBannerColor(e.target.value)}
                    className="h-12 w-14 cursor-pointer rounded-xl border border-white/20 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bannerColor}
                    onChange={(e) => setBannerColor(e.target.value)}
                    placeholder="#aabbcc"
                    className="flex-1 h-12 rounded-xl bg-white/10 border border-white/20 px-4 text-base text-white font-mono placeholder-white/30 focus:outline-none focus:border-white/50"
                  />
                </div>
              </div>

              {/* Suggested colors */}
              {suggestedColors.length > 0 && (
                <div>
                  <Label className="text-base font-medium text-white/80 mb-2 block">Рекомендуемые цвета</Label>
                  <div className="flex flex-wrap gap-3">
                    {suggestedColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        title={c}
                        onClick={() => setBannerColor(c)}
                        className="rounded-full transition-transform hover:scale-110"
                        style={{
                          width: 44, height: 44,
                          background: c,
                          border: normalizeHex(c) === normalizeHex(bannerColor) ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <Switch checked={bannerActive} onCheckedChange={setBannerActive} id="banner-active" />
                <Label htmlFor="banner-active" className="text-base text-white/90">Активный баннер</Label>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 mt-auto pt-2">
                <button
                  type="button"
                  disabled={bannerMutation.isPending || (!bannerImageFile && !editingBanner?.image)}
                  onClick={() => bannerMutation.mutate({ background_color: bannerColor, is_active: bannerActive, image: bannerImageFile })}
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-base font-semibold text-white bg-[#007AFF] hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {bannerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Сохранить
                </button>
                {editingBanner && (
                  <button
                    type="button"
                    disabled={deleteBannerMutation.isPending}
                    onClick={() => { deleteBannerMutation.mutate(); closeBannerForm(); }}
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-base font-semibold text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />Удалить баннер
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeBannerForm}
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-base font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>

            {/* Right: DCard-style card preview + upload below */}
            <div className="flex flex-col gap-4 sm:w-[55%]">
              <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Preview</p>

              {/* Card preview — mirrors how DCard shows the merchant */}
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
                {/* Banner image area */}
                <div className="w-full" style={{ aspectRatio: '16/9', background: bannerColor }}>
                  {bannerPreviewUrl ? (
                    <img src={bannerPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: textOnBg(bannerColor), opacity: 0.35 }}>
                      <ImageUp className="h-10 w-10" />
                    </div>
                  )}
                </div>
                {/* Info section with live background color */}
                <div className="px-4 pt-3 pb-4" style={{ background: bannerColor }}>
                  {bannerActive && (
                    <span
                      className="inline-block text-xs px-2.5 py-0.5 rounded-full mb-2 font-medium border"
                      style={{
                        color: textOnBg(bannerColor),
                        borderColor: `${textOnBg(bannerColor)}40`,
                        background: `${textOnBg(bannerColor)}18`,
                      }}
                    >
                      Barcha filiallar uchun
                    </span>
                  )}
                  <p className="text-lg font-bold leading-tight" style={{ color: textOnBg(bannerColor) }}>
                    {profile?.name ?? 'Название компании'}
                  </p>
                  <p className="text-sm mt-0.5 opacity-80" style={{ color: textOnBg(bannerColor) }}>
                    {outlets[0] ? `${outlets[0].city}, ${outlets[0].address}` : 'Ташкент, улица Навои, 1'}
                  </p>
                </div>
              </div>

              {/* Upload control */}
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 border-white/20"
                  style={{ background: bannerColor }}
                >
                  {bannerPreviewUrl ? (
                    <img src={bannerPreviewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <ImageUp className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-colors select-none">
                    <ImageUp className="h-4 w-4" />
                    {bannerPreviewUrl ? 'Сменить фото' : 'Загрузить фото'}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleBannerImageSelect(f); }} />
                  </label>
                  {bannerPreviewUrl && (
                    <button
                      type="button"
                      className="text-xs text-white/50 hover:text-white/80 transition-colors text-left"
                      onClick={() => { if (bannerPreviewRef.current) URL.revokeObjectURL(bannerPreviewRef.current); setBannerImageFile(null); setBannerPreviewUrl(null); setSuggestedColors([]); }}
                    >
                      Удалить изображение
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, ImageUp, FileText, ExternalLink, Trash2, Eye, X } from 'lucide-react';
import { fetchPartnerProfile, updatePartnerProfile } from '@/api/partnerProfile';
import type { Partner } from '@/types';
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
import { mediaUrl } from '@/lib/assets';

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [deleteLogo, setDeleteLogo] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState(false);

  const { data: profile, isLoading, isError, refetch } = useQuery<Partner>({
    queryKey: ['partnerProfile'],
    queryFn: () => fetchPartnerProfile(),
  });

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
      setLogoFile(null);
      setMenuFile(null);
      setDeleteLogo(false);
      setDeleteMenu(false);
    },
    onError: () => toast.error('Ошибка сохранения'),
  });

  const currentLogoUrl = deleteLogo
    ? null
    : logoFile
      ? URL.createObjectURL(logoFile)
      : mediaUrl(profile?.logo);

  const currentMenuUrl = deleteMenu ? null : mediaUrl(profile?.menu);
  const menuDisplayName = menuFile?.name ?? (profile?.menu && !deleteMenu ? profile.menu.split('/').pop() : null);

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Профиль" description="Информация о вашей компании" />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      ) : profile ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">

            {/* Header with logo */}
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setLogoDialogOpen(true)}
                  className="relative group shrink-0"
                  title="Нажмите для управления логотипом"
                >
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={currentLogoUrl ?? undefined} />
                    <AvatarFallback><Building2 className="h-8 w-8" /></AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                </button>
                <div>
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile.slug}</p>
                  {logoFile && <p className="text-xs text-primary mt-1">{logoFile.name}</p>}
                  {deleteLogo && !logoFile && <p className="text-xs text-destructive mt-1">Логотип будет удалён при сохранении</p>}
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(currentMenuUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Открыть
                    </Button>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-primary-foreground bg-[#1A3F75] hover:bg-[#1D4A90] transition-colors shadow-sm select-none">
                    <ImageUp className="h-4 w-4" />
                    Загрузить
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="sr-only"
                      onChange={(e) => {
                        setMenuFile(e.target.files?.[0] ?? null);
                        setDeleteMenu(false);
                      }}
                    />
                  </label>
                  {(currentMenuUrl || menuFile) && !deleteMenu && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => { setDeleteMenu(true); setMenuFile(null); }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  )}
                  {!menuDisplayName && !deleteMenu && (
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG до 10 МБ</p>
                  )}
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

      {/* Logo lightbox */}
      {logoDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md"
          onClick={() => setLogoDialogOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLogoDialogOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="max-w-[85vw] max-h-[75vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentLogoUrl ? (
              <img
                src={currentLogoUrl}
                alt="Логотип"
                className="max-w-[85vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="h-40 w-40 flex items-center justify-center rounded-2xl bg-white/10">
                <Building2 className="h-16 w-16 text-white/40" />
              </div>
            )}
          </div>

          <div
            className="flex gap-3 mt-6"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#1A3F75] hover:bg-[#1D4A90] transition-colors select-none shadow-lg">
              <ImageUp className="h-4 w-4" />
              Загрузить
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  setLogoFile(e.target.files?.[0] ?? null);
                  setDeleteLogo(false);
                  setLogoDialogOpen(false);
                }}
              />
            </label>
            {currentLogoUrl && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                onClick={() => { setDeleteLogo(true); setLogoFile(null); setLogoDialogOpen(false); }}
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

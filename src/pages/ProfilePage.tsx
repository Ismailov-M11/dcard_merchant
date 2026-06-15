import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, ImageUp } from 'lucide-react';
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
      { logo: logoFile },
    ),
    onSuccess: () => { toast.success('Профиль обновлён'); qc.invalidateQueries({ queryKey: ['partnerProfile'] }); setLogoFile(null); },
    onError: () => toast.error('Ошибка сохранения'),
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Профиль" description="Информация о вашей компании" />
      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>
      ) : profile ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={mediaUrl(profile.logo)} />
                <AvatarFallback><Building2 className="h-8 w-8" /></AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.slug}</p>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
              <Tabs defaultValue="general">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">Контакты</TabsTrigger>
                  <TabsTrigger value="social">Соцсети</TabsTrigger>
                  <TabsTrigger value="description">Описание</TabsTrigger>
                  <TabsTrigger value="logo">Логотип</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                  <Card><CardHeader><CardTitle>Контактная информация</CardTitle></CardHeader>
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
                </TabsContent>
                <TabsContent value="social">
                  <Card><CardHeader><CardTitle>Социальные сети</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {(['instagram_url', 'telegram_url', 'youtube_url', 'facebook_url'] as const).map((field) => (
                        <FormField key={field} control={form.control} name={field} render={({ field: f }) => (
                          <FormItem><FormLabel>{field.replace('_url', '').replace(/^\w/, c => c.toUpperCase())}</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>
                        )} />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="description">
                  <Card><CardHeader><CardTitle>Описание</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="description_ru" render={({ field }) => (
                        <FormItem><FormLabel>Описание (RU)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="description_uz" render={({ field }) => (
                        <FormItem><FormLabel>Описание (UZ)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="logo">
                  <Card><CardHeader><CardTitle>Логотип</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-5">
                        {profile.logo && (
                          <img src={mediaUrl(profile.logo)} alt="Логотип" className="h-20 w-20 object-contain rounded-xl border shrink-0" />
                        )}
                        <div className="flex flex-col gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#007AFF] hover:opacity-90 transition-opacity shadow-sm select-none">
                            <ImageUp className="h-4 w-4" />
                            Выбрать файл
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                            />
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {logoFile ? logoFile.name : 'PNG, JPG, SVG до 5 МБ'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить изменения
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : null}
    </div>
  );
}

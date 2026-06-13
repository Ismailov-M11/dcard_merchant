import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { OutletLocation } from '@/types';

type LocationPickerProps = {
  value?: OutletLocation | null;
  onChange?: (value: OutletLocation | null) => void;
  onAddressChange?: (payload: { address?: string; city?: string } | null) => void;
};

const defaultCenter: [number, number] = [41.2995, 69.2401];

const LocationPicker = ({ value = null, onChange = () => {}, onAddressChange }: LocationPickerProps) => {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY ?? '';
  const center = useMemo<[number, number]>(() => {
    if (value) return [value.lat, value.lng];
    return defaultCenter;
  }, [value]);

  const resolveAddress = useCallback(
    async (coords: [number, number]) => {
      if (!onAddressChange || !apiKey) return;
      try {
        const params = new URLSearchParams({
          apikey: apiKey,
          geocode: `${coords[1]},${coords[0]}`,
          format: 'json',
          lang: 'ru_RU',
        });
        const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params.toString()}`);
        const data = await response.json();
        const members = data?.response?.GeoObjectCollection?.featureMember;
        const first = Array.isArray(members) ? members[0]?.GeoObject : null;
        const address = first?.metaDataProperty?.GeocoderMetaData?.text;
        let city: string | undefined;
        const components = first?.metaDataProperty?.GeocoderMetaData?.Address?.Components;
        if (Array.isArray(components)) {
          const locality = components.find((c: { kind: string }) => c.kind === 'locality');
          const area = components.find((c: { kind: string }) => c.kind === 'area');
          city = locality?.name || area?.name;
        }
        onAddressChange({ address: address ?? undefined, city });
      } catch {
        onAddressChange(null);
      }
    },
    [apiKey, onAddressChange],
  );

  const handleMapClick = useCallback(
    (event: { get: (key: string) => [number, number] }) => {
      const coords = event.get('coords');
      if (!coords) return;
      const next = { lat: coords[0], lng: coords[1] };
      onChange(next);
      resolveAddress([coords[0], coords[1]]);
    },
    [onChange, resolveAddress],
  );

  return (
    <div className="space-y-2">
      <div className="h-64 border rounded-md overflow-hidden">
        <YMaps query={{ apikey: apiKey, lang: 'en_US' }}>
          <Map
            defaultState={{ center, zoom: value ? 14 : 12 }}
            state={{ center, zoom: value ? 14 : 12 }}
            width="100%"
            height="100%"
            onClick={handleMapClick}
          >
            {value && <Placemark geometry={[value.lat, value.lng]} />}
          </Map>
        </YMaps>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Нажмите на карту, чтобы указать местоположение</span>
        <Button size="sm" variant="outline" onClick={() => onChange(null)} disabled={!value}>
          Сбросить
        </Button>
      </div>
    </div>
  );
};

export default LocationPicker;

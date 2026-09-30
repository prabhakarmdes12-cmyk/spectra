import type { SensorLayer } from '../../lib/sensors/types';
import { useSpectraStore } from '../../stores/useSpectraStore';

const layers: Array<{ id: SensorLayer; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'magnetic', label: 'Mag' },
  { id: 'audio', label: 'Audio' },
  { id: 'rf', label: 'RF' },
  { id: 'motion', label: 'Motion' },
  { id: 'light', label: 'Light' },
  { id: 'spatial', label: 'Spatial' },
];

export function LayerSelector() {
  const activeLayer = useSpectraStore((state) => state.activeLayer);
  const setActiveLayer = useSpectraStore((state) => state.setActiveLayer);
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-black/45 p-1 backdrop-blur-md">
      {layers.map((layer) => (
        <button
          key={layer.id}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            activeLayer === layer.id ? 'bg-cyan text-black shadow-lg shadow-cyan/20' : 'text-white/55 hover:bg-white/10 hover:text-white'
          }`}
          onClick={() => setActiveLayer(layer.id)}
        >
          {layer.label}
        </button>
      ))}
    </div>
  );
}

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

interface Props {
  images: string[]
  roomName: string
}

export default function ImageCarousel({ images, roomName }: Props) {
  const [current, setCurrent] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-72 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <ImageOff size={48} />
        <span className="mt-2 text-sm">ไม่มีรูปภาพ</span>
      </div>
    )
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length)
  const next = () => setCurrent((c) => (c + 1) % images.length)

  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden bg-gray-100 group">
      <img
        src={images[current]}
        alt={`${roomName} ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=No+Image' }}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
        {current + 1} / {images.length}
      </div>
    </div>
  )
}

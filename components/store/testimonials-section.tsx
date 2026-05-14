'use client'

import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { Testimonial } from '@/lib/types'
import useEmblaCarousel from 'embla-carousel-react'

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const activeTestimonials = testimonials.filter(t => t.is_active)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <section className="py-16 bg-muted overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            O QUE NOSSOS CLIENTES DIZEM
          </h2>
          <p className="text-muted-foreground mt-2">Arraste para ver mais depoimentos</p>
        </div>

        <div className="relative group">
          {/* Testimonials Carousel */}
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex gap-6">
              {activeTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-none w-[280px] md:w-[350px]"
                >
                  <div className="bg-card rounded-2xl p-6 shadow-md h-full border border-border flex flex-col hover:shadow-lg transition-shadow">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/20">
                        <span className="text-primary font-bold text-lg">
                          {testimonial.customer_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          {testimonial.customer_name}
                        </h4>
                        {/* Stars */}
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 md:w-4 h-4 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-muted-foreground text-sm leading-relaxed italic flex-1">
                      "{testimonial.content}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white shadow-xl border rounded-full hidden md:flex items-center justify-center hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white shadow-xl border rounded-full hidden md:flex items-center justify-center hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  )
}

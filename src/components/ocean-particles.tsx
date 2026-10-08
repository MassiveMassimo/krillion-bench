"use client";

import { useEffect, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, motionValue } from "framer-motion";
import { companyLogos } from "@/lib/company-logos";
import { createSinkingLogo, stepSinkingLogo, type OceanBounds } from "@/lib/ocean-physics";
import parallax from "@/components/ocean-parallax.module.css";

const LOGO_COUNT = 12;
const BUBBLE_COUNT = 40;

function createVisual() {
  return { x: motionValue(0), y: motionValue(0), rotate: motionValue(0), opacity: motionValue(0) };
}

export function OceanParticles() {
  const layerRef = useRef<HTMLDivElement>(null);
  const logoElements = useRef<(HTMLSpanElement | null)[]>([]);
  const [visuals] = useState(() => ({
    logos: Array.from({ length: LOGO_COUNT }, createVisual),
    bubbles: Array.from({ length: BUBBLE_COUNT }, createVisual),
  }));
  useEffect(() => {
    const layer = layerRef.current;
    const frame = layer?.closest(".site-frame");
    const card = frame?.querySelector("#results");
    const backdrop = frame?.querySelector(".ocean-backdrop");
    if (!layer || !frame || !card || !backdrop) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const readBounds = (): OceanBounds => {
      const rootRect = frame.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      return {
        width: rootRect.width,
        height: backdrop.getBoundingClientRect().height + 18,
        cardLeft: cardRect.left - rootRect.left,
        cardRight: cardRect.right - rootRect.left,
        cardTop: cardRect.top - rootRect.top,
        cardBottom: cardRect.bottom - rootRect.top,
        cardRadius: parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0,
      };
    };
    let bounds = readBounds();
    layer.style.height = `${bounds.height}px`;
    const random = Math.random;
    let nextBrand = LOGO_COUNT;
    const logos = Array.from({ length: LOGO_COUNT }, (_, index) =>
      createSinkingLogo(bounds, random, (index / LOGO_COUNT) * (bounds.cardTop - 60) - 30),
    );
    const bubbles = Array.from({ length: BUBBLE_COUNT }, () => ({
      x: 0,
      y: 0,
      age: 0,
      life: 0,
      speed: 0,
      phase: 0,
    }));
    const measure = () => {
      const previousWidth = bounds.width;
      bounds = readBounds();
      const widthRatio = bounds.width / previousWidth;
      if (widthRatio !== 1) {
        logos.forEach((logo) => {
          logo.originX *= widthRatio;
          logo.x *= widthRatio;
        });
        bubbles.forEach((bubble) => {
          bubble.x *= widthRatio;
        });
      }
      layer.style.height = `${bounds.height}px`;
    };
    const setBrand = (index: number, brandIndex: number) => {
      const el = logoElements.current[index];
      if (!el) return;
      const brand = companyLogos[brandIndex % companyLogos.length];
      const mask = `url("/company-logos/${brand.id}.svg")`;
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
      el.dataset.company = brand.id;
      el.dataset.phase = "sinking";
    };
    logos.forEach((_, index) => setBrand(index, index));
    const emitBubble = (x: number, y: number) => {
      const index = bubbles.findIndex((bubble) => bubble.life === 0);
      if (index === -1) return;
      const bubble = bubbles[index];
      Object.assign(bubble, {
        x: x + (random() - 0.5) * 12,
        y,
        age: 0,
        life: 2 + random() * 2,
        speed: 14 + random() * 14,
        phase: random() * Math.PI * 2,
      });
    };

    const updateLogos = (dt: number, collisionBounds: OceanBounds) => {
      const mobile = bounds.width < 768;
      logos.forEach((logo, index) => {
        if (mobile && index >= 8) {
          visuals.logos[index].opacity.set(0);
          return;
        }
        const bounced = stepSinkingLogo(logo, dt, collisionBounds, random);
        if (bounced) {
          logoElements.current[index]!.dataset.phase = "bounced";
          for (let burst = 0; burst < 3; burst++) emitBubble(logo.x, logo.y);
        }
        logo.bubbleIn -= dt;
        if (logo.bubbleIn <= 0 && logo.y > 0 && logo.y < bounds.height) {
          emitBubble(logo.x, logo.y - logo.size / 2);
          logo.bubbleIn = 1.3 + random() * 1.8;
        }
        if (logo.y > bounds.height + logo.size) {
          Object.assign(logo, createSinkingLogo(bounds, random, -40 - random() * 60));
          setBrand(index, nextBrand++);
        }
        const visual = visuals.logos[index];
        visual.x.set(logo.x - 9);
        visual.y.set(logo.y - 9);
        visual.rotate.set(Math.sin(logo.age * 0.55 + logo.phase) * 12 + logo.drift * 0.25);
        visual.opacity.set(Math.min(1, Math.max(0, logo.y / 50)) * (mobile ? 0.2 : 0.3));
      });
    };
    const updateBubbles = (dt: number) => {
      bubbles.forEach((bubble, index) => {
        if (bubble.life === 0) return;
        bubble.age += dt;
        const visual = visuals.bubbles[index];
        if (bubble.age >= bubble.life) {
          bubble.life = 0;
          visual.opacity.set(0);
          return;
        }
        visual.x.set(bubble.x + Math.sin(bubble.age * 1.5 + bubble.phase) * 5);
        visual.y.set(bubble.y - bubble.age * bubble.speed);
        visual.opacity.set(Math.sin((bubble.age / bubble.life) * Math.PI) * 0.34);
      });
    };

    let raf = 0;
    let lastTime = 0;
    let inView = true;
    const tick = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 0;
      lastTime = time;
      // CSS owns scroll motion. Read its layer translation before writing logo transforms.
      // Cached card geometry stays in page coordinates; collisions use particle coordinates.
      const transform = getComputedStyle(layer).transform;
      const offset = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
      updateLogos(dt, {
        ...bounds,
        cardTop: bounds.cardTop - offset,
        cardBottom: bounds.cardBottom - offset,
      });
      updateBubbles(dt);
      raf = requestAnimationFrame(tick);
    };
    const syncPlayback = () => {
      cancelAnimationFrame(raf);
      lastTime = 0;
      if (inView && !document.hidden && !motionPreference.matches)
        raf = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(frame);
    resize.observe(card);
    resize.observe(backdrop);
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    intersection.observe(layer);
    document.addEventListener("visibilitychange", syncPlayback);
    motionPreference.addEventListener("change", syncPlayback);
    syncPlayback();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motionPreference.removeEventListener("change", syncPlayback);
      [...visuals.logos, ...visuals.bubbles].forEach((visual) => visual.opacity.set(0));
    };
  }, [visuals]);

  return (
    <LazyMotion features={domAnimation}>
      <div className={`ocean-particles ${parallax.particles}`} ref={layerRef} aria-hidden="true">
        {visuals.logos.map((visual, index) => (
          <m.span
            key={index}
            className="ocean-logo backdrop-blur-sm"
            ref={(el) => {
              logoElements.current[index] = el;
            }}
            style={visual}
          />
        ))}
        {visuals.bubbles.map((visual, index) => (
          <m.span key={index} className="ocean-bubble" style={visual} />
        ))}
      </div>
    </LazyMotion>
  );
}

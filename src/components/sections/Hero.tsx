import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/sections/SearchBar";
import { HeroExploreCue } from "@/components/sections/HeroExploreCue";
import { getActiveHeroImage } from "@/lib/hero-images";

export async function Hero() {
  const t = await getTranslations("Home");
  const hero = getActiveHeroImage();

  const common = {
    alt: "",
    sizes: "100vw",
    priority: true,
  } as const;

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    width: 2400,
    height: 1350,
    quality: 82,
    src: hero.desktop,
  });

  const {
    props: { srcSet: mobileSrcSet, width: _mw, height: _mh, style: _ms, ...mobileImg },
  } = getImageProps({
    ...common,
    width: 1200,
    height: 1800,
    quality: 80,
    src: hero.mobile,
  });
  return (
    <section className="home-hero-fullscreen relative isolate flex flex-col overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <picture>
          <source media="(min-width: 640px)" srcSet={desktopSrcSet} sizes="100vw" />
          {/* eslint-disable-next-line @next/next/no-img-element -- art-directed hero via getImageProps */}
          <img
            {...mobileImg}
            srcSet={mobileSrcSet}
            sizes="100vw"
            alt=""
            className="home-hero-bg-img absolute inset-0 h-full w-full"
            style={
              {
                "--hero-object-position-mobile": hero.objectPositionMobile,
                "--hero-object-position-desktop": hero.objectPositionDesktop,
              } as CSSProperties
            }
          />
        </picture>
      </div>
      <div className="home-hero-overlay pointer-events-none absolute inset-0" aria-hidden />

      <div className="home-hero-content relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-24 text-center sm:px-6 sm:pb-28">
        <h1 className="home-hero-title max-w-3xl font-display font-medium tracking-tight text-white">
          {t("heroTitle")}
        </h1>

        <p className="home-hero-subtitle mt-3 max-w-[760px] text-[0.9375rem] leading-relaxed text-white/88 sm:mt-4 sm:text-lg">
          {t("heroSubtitle")}
        </p>

        <div className="relative z-20 mt-6 w-full max-w-4xl text-left sm:mt-7" id="search">
          <SearchBar variant="fullscreen" />
        </div>

        <p className="home-hero-microcopy mt-3.5 max-w-lg text-center text-[12px] leading-relaxed text-white sm:mt-4 sm:text-[13px]">
          {t("heroMicrocopy")}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center sm:bottom-7">
        <HeroExploreCue />
      </div>
    </section>
  );
}

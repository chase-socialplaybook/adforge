import Link from "next/link";
import {
  Zap,
  Upload,
  Palette,
  Download,
  ArrowRight,
  Sparkles,
  Target,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-Powered Ad Creative Generation
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Create Meta ads
              <br />
              <span className="text-primary">that convert.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Upload competitor inspiration, input your brand kit, and generate
              pixel-perfect, ready-to-publish Meta ad creatives in seconds.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/create"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
              >
                Create Your First Ad
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              From inspiration to export in three simple steps.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Upload Inspiration",
                description:
                  "Drop in competitor ad screenshots. Our AI analyzes layout, copy patterns, CTA placement, and visual hierarchy.",
                step: "01",
              },
              {
                icon: Palette,
                title: "Input Your Brand",
                description:
                  "Add your logo, brand colors, fonts, and tone of voice. We ensure every ad is on-brand and consistent.",
                step: "02",
              },
              {
                icon: Download,
                title: "Generate & Export",
                description:
                  "Get multiple ad variations at exact Meta specs. Download as PNG or export all as a ZIP bundle.",
                step: "03",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-border/50 bg-card p-8 transition-colors hover:border-primary/30"
              >
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
                  Step {item.step}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for performance
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Target,
                title: "Pixel-Perfect",
                description: "Exact Meta ad specs at 2x retina quality",
              },
              {
                icon: Zap,
                title: "AI-Powered",
                description: "Claude Vision analyzes winning ad patterns",
              },
              {
                icon: Layers,
                title: "Multi-Format",
                description: "Feed, Story, Link ads — all standard sizes",
              },
              {
                icon: Sparkles,
                title: "Brand Consistent",
                description: "Your colors, fonts, and logo in every creative",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/50 bg-card/50 p-6"
              >
                <feature.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to create?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start generating professional Meta ad creatives now.
          </p>
          <Link
            href="/create"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

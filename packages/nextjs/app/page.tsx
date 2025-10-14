import Link from "next/link";

export const metadata = {
  title: "Cushion",
};

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6">Cushion</h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl font-semibold text-base-content/80 mb-8">text1</p>

            {/* Description */}
            <p className="text-lg text-base-content/70 leading-relaxed mb-12 max-w-2xl mx-auto">text2</p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/dashboard" className="btn btn-primary btn-lg px-8 py-3 text-lg">
                Dashboard
              </Link>
              <Link href="/vault" className="btn btn-outline btn-lg px-8 py-3 text-lg">
                Vault
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">text5</div>
                <div className="text-base-content/70">text6</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">text7</div>
                <div className="text-base-content/70">text8</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">text9</div>
                <div className="text-base-content/70">text10</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent/10 rounded-full blur-lg"></div>
      </section>

      {/* Features Preview */}
      <section className="py-20 px-4 bg-base-100">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">text11</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">text12</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">text13</h3>
              <p className="text-base-content/70">text14</p>
            </div>

            <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">text15</h3>
              <p className="text-base-content/70">text16</p>
            </div>

            <div className="card bg-base-100 rounded-2xl border border-base-300/60 shadow-sm p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">text17</h3>
              <p className="text-base-content/70">text18</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

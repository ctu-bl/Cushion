import Link from "next/link";

export const metadata = {
  title: "Cushion",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-base-200">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-base-200 to-accent/10 py-20 px-4 overflow-hidden">
        {/* Animated Background Elements - Left Side */}
        <div
          className="absolute left-0 top-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute left-20 top-1/2 w-64 h-64 bg-accent/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "3s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute left-10 bottom-1/4 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        ></div>

        {/* Animated Background Elements - Right Side */}
        <div
          className="absolute right-0 top-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s" }}
        ></div>
        <div
          className="absolute right-20 top-2/3 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute right-10 bottom-1/3 w-48 h-48 bg-accent/8 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "4.5s", animationDelay: "1.5s" }}
        ></div>

        {/* Additional Floating Elements for Depth */}
        <div
          className="absolute left-1/4 top-10 w-32 h-32 bg-primary/8 rounded-full blur-xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute right-1/4 bottom-10 w-40 h-40 bg-accent/12 rounded-full blur-xl animate-pulse"
          style={{ animationDuration: "5.5s", animationDelay: "1s" }}
        ></div>

        <div className="container mx-auto">
          <div className="text-center max-w-5xl mx-auto relative">
            {/* Cushion Shield Logo - Central Visual */}
            <div className="relative mb-8 flex justify-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                {/* Shield with glow effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <svg
                  className="relative w-full h-full text-primary drop-shadow-2xl"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>

                {/* Floating Asset Icons around shield */}
                {/* Ethereum Logo - Top Left */}
                <div className="absolute -top-4 -left-8 w-12 h-12 bg-base-100 rounded-full p-2 shadow-lg animate-bounce">
                  <svg viewBox="0 0 256 417" className="w-full h-full">
                    <path fill="#343434" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
                    <path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
                    <path fill="#3C3C3B" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
                    <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" />
                    <path fill="#141414" d="M127.961 287.958l127.96-75.637-127.96-58.162z" />
                    <path fill="#393939" d="M0 212.32l127.96 75.638v-133.8z" />
                  </svg>
                </div>

                {/* pyUSD Icon - Top Right */}
                <div
                  className="absolute -top-4 -right-8 w-12 h-12 bg-base-100 rounded-full p-2 shadow-lg animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full text-green-500" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                  </svg>
                </div>

                {/* USDC Icon - Bottom Left */}
                <div
                  className="absolute -bottom-4 -left-8 w-12 h-12 bg-base-100 rounded-full p-2 shadow-lg animate-bounce"
                  style={{ animationDelay: "1s" }}
                >
                  <svg viewBox="0 0 256 256" className="w-full h-full">
                    <circle cx="128" cy="128" r="128" fill="#2775CA" />
                    <path
                      d="M128 224c53.019 0 96-42.981 96-96S181.019 32 128 32 32 74.981 32 128s42.981 96 96 96z"
                      fill="#fff"
                    />
                    <path
                      d="M164.8 134.4c0-13.6-9.6-20.8-28.8-22.4v-27.2c8 1.6 14.4 6.4 16.8 14.4h22.4c-2.4-18.4-14.4-32-39.2-35.2V48h-16v16.8c-22.4 3.2-36.8 16.8-36.8 36.8 0 20 12.8 29.6 36.8 32v30.4c-11.2-1.6-19.2-8-20.8-17.6H76.8c1.6 20 16 33.6 39.2 36v16h16v-16c24-3.2 36.8-16.8 36.8-36zm-52.8-24c-12-1.6-16.8-6.4-16.8-13.6 0-8 6.4-13.6 16.8-15.2v28.8zm20.8 43.2v-32c12 2.4 17.6 7.2 17.6 15.2 0 8.8-6.4 14.4-17.6 16.8z"
                      fill="#2775CA"
                    />
                  </svg>
                </div>

                {/* pyUSD Icon - Bottom Right */}
                <div
                  className="absolute -bottom-4 -right-8 w-12 h-12 bg-base-100 rounded-full p-2 shadow-lg animate-bounce"
                  style={{ animationDelay: "1.5s" }}
                >
                  <svg viewBox="0 0 84.3 84.9" className="w-full h-full">
                    <path
                      fill="#0071F3"
                      d="M42.1,84.9c23.3,0,42.1-19,42.1-42.4C84.3,19,65.4,0,42.1,0C18.9,0,0,19,0,42.4C0,65.9,18.9,84.9,42.1,84.9z"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M48.8,17h-4.6H34c-1.6,0-3.1,1.2-3.3,2.9l-1,6.8v0.1h-5c-1.3,0-2.4,1.1-2.4,2.4c0,1.4,1.1,2.4,2.4,2.5h4.2l-0.7,4.7l0,0.4h-5c-1.3,0-2.4,1.1-2.4,2.4c0,1.3,1.1,2.4,2.4,2.4h4.2l-2.3,14.6l-0.7,4.9l-0.4,2.6c-0.3,2.1,1.2,3.9,3.3,3.9h3.2h4.4h3.6c1.6,0,3-1.2,3.3-2.9l2.1-13.4h1.2h4c9.4,0,17.1-7.8,16.9-17.3C65.9,24.3,58.1,17,48.8,17z M33.8,31.5l15,0.1c1.3,0,2.5,1.1,2.5,2.5c0,1.4-1.1,2.5-2.5,2.5H33L33.8,31.5z M48.9,46.1h-2.5h-1.2h-2.5c-1.6,0-3,1.2-3.3,2.9l-2.1,13.4H29l3.2-21h16.6c4,0,7.3-3.3,7.3-7.3c0-4-3.3-7.3-7.3-7.3l-14.2-0.1l0.7-4.8h13.8c6.8,0,12.2,5.6,12.1,12.4C61,40.9,55.5,46.1,48.9,46.1z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-base-content flex items-center justify-center gap-4">
              Cushion
            </h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl font-semibold text-base-content/80 mb-4">
              Protect Your DeFi Assets from Liquidation
            </p>

            {/* Description */}
            <p className="text-lg text-base-content/70 leading-relaxed mb-12 max-w-2xl mx-auto">
              Automated insurance protocol that safeguards your lending positions. Sleep soundly knowing Cushion has
              your back.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/dashboard"
                className="btn btn-primary btn-lg px-8 py-3 text-lg shadow-xl hover:shadow-2xl transition-all"
              >
                Get Protected
              </Link>
              <Link
                href="/vault"
                className="btn btn-outline border-base-content/20 hover:bg-base-100 text-base-content btn-lg px-8 py-3 text-lg"
              >
                Explore Vault
              </Link>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center p-6 bg-base-100 rounded-xl border border-base-content/10">
                <div className="text-3xl font-bold text-base-content mb-2">24/7</div>
                <div className="text-base-content/70">Automated Monitoring</div>
              </div>
              <div className="text-center p-6 bg-base-100 rounded-xl border border-base-content/10">
                <div className="text-3xl font-bold text-base-content mb-2">Aave V3</div>
                <div className="text-base-content/70">Protocol Integration</div>
              </div>
              <div className="text-center p-6 bg-base-100 rounded-xl border border-base-content/10">
                <div className="text-3xl font-bold text-base-content mb-2">Sepolia</div>
                <div className="text-base-content/70">Live on Testnet</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/10 rounded-full blur-lg animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        ></div>
      </section>

      {/* Features Preview */}
      <section className="py-20 px-4 bg-base-100">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-base-content">How Cushion Works</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Earn yield while providing liquidation insurance for Aave borrowers. Automated protection that works 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Automated Protection */}
            <div className="group bg-base-100 rounded-3xl border border-base-content/10 p-8 text-center hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-2">
              <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <svg className="w-10 h-10 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-base-content">Automated Protection</h3>
              <p className="text-base-content leading-relaxed">
                Our keepers monitor your health factor 24/7 and automatically inject pyUSD when needed to prevent
                liquidation.
              </p>
            </div>

            {/* Card 2 - Earn Passive Yield */}
            <div className="group bg-base-100 rounded-3xl border border-base-content/10 p-8 text-center hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-2">
              <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <svg className="w-10 h-10 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-base-content">Earn Passive Yield</h3>
              <p className="text-base-content leading-relaxed">
                Deposit pyUSD into our vault and earn <span className="font-semibold text-accent">15% APY</span> while
                providing liquidity insurance for the protocol.
              </p>
            </div>

            {/* Card 3 - Reduced Losses */}
            <div className="group bg-base-100 rounded-3xl border border-base-content/10 p-8 text-center hover:border-accent/50 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-2">
              <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <svg className="w-10 h-10 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-base-content">Reduced Losses</h3>
              <p className="text-base-content leading-relaxed">
                Pay a small fee for protection and significantly reduce your liquidation losses if markets turn against
                you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

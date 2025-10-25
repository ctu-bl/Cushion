import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 contracts in an easy way",
});

const Debug: NextPage = () => {
  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-base-content">Debug Contracts</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            You can debug & interact with your deployed contracts here.
            <br />
            <code className="italic bg-base-100 text-base-content font-bold px-2 py-1 rounded mt-2 inline-block border border-base-content/10">
              packages / nextjs / app / debug / page.tsx
            </code>
          </p>
        </div>
        <DebugContracts />
      </div>
    </div>
  );
};

export default Debug;

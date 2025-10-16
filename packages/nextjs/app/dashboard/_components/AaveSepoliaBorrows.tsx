// AI helped me with aave borrows viem implementation because i have never used these libraries before
import React, { useEffect, useMemo, useState } from "react";
import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";
import Big from "bignumber.js";
import { createPublicClient, formatUnits, getAddress, http } from "viem";
import { sepolia } from "viem/chains";

type BorrowRow = {
  symbol: string;
  amountToken: string;
};

type Props = { address: `0x${string}`; rpcUrl?: string; className?: string };

const cx = (...c: Array<string | undefined | false>) => c.filter(Boolean).join(" ");

const ABIS = {
  POOL_ADDRESSES_PROVIDER: [
    {
      inputs: [],
      name: "getPoolDataProvider",
      outputs: [{ type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const,
  DATA_PROVIDER: [
    {
      inputs: [],
      name: "getAllReservesTokens",
      outputs: [
        {
          type: "tuple[]",
          components: [
            { name: "symbol", type: "string" },
            { name: "tokenAddress", type: "address" },
          ],
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ name: "asset", type: "address" }],
      name: "getReserveTokensAddresses",
      outputs: [
        { name: "aTokenAddress", type: "address" },
        { name: "stableDebtTokenAddress", type: "address" },
        { name: "variableDebtTokenAddress", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ] as const,
  ERC20: [
    { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const,
};

export default function AaveSepoliaBorrowsViem({ address, rpcUrl, className }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BorrowRow[]>([]);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl ?? sepolia.rpcUrls.default.http[0]!),
      }),
    [rpcUrl],
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!address) return;
      setLoading(true);
      setError(null);

      try {
        const dataProviderAddr = await client.readContract({
          address: AaveV3Sepolia.POOL_ADDRESSES_PROVIDER as `0x${string}`,
          abi: ABIS.POOL_ADDRESSES_PROVIDER,
          functionName: "getPoolDataProvider",
        });

        const reserves = (await client.readContract({
          address: dataProviderAddr,
          abi: ABIS.DATA_PROVIDER,
          functionName: "getAllReservesTokens",
        })) as Array<{ symbol: string; tokenAddress: `0x${string}` }>;

        const out: BorrowRow[] = [];

        for (const r of reserves) {
          const [, stableDebtToken, variableDebtToken] = (await client.readContract({
            address: dataProviderAddr,
            abi: ABIS.DATA_PROVIDER,
            functionName: "getReserveTokensAddresses",
            args: [r.tokenAddress],
          })) as [`0x${string}`, `0x${string}`, `0x${string}`];

          const [decimals, symbol] = await Promise.all([
            client.readContract({
              address: r.tokenAddress,
              abi: ABIS.ERC20,
              functionName: "decimals",
            }) as Promise<number>,
            (async () => {
              try {
                return (await client.readContract({
                  address: r.tokenAddress,
                  abi: ABIS.ERC20,
                  functionName: "symbol",
                })) as string;
              } catch {
                return r.symbol;
              }
            })(),
          ]);

          const [varBal, stBal] = await Promise.all([
            client.readContract({
              address: variableDebtToken,
              abi: ABIS.ERC20,
              functionName: "balanceOf",
              args: [address],
            }) as Promise<bigint>,
            client.readContract({
              address: stableDebtToken,
              abi: ABIS.ERC20,
              functionName: "balanceOf",
              args: [address],
            }) as Promise<bigint>,
          ]);

          const totalWei = varBal + stBal;
          if (totalWei === 0n) continue;

          const human = formatUnits(totalWei, decimals);
          out.push({ symbol, amountToken: human });
        }

        if (!cancelled) {
          out.sort((a, b) => {
            const cmp = new Big(b.amountToken).comparedTo(new Big(a.amountToken));
            return cmp === null ? 0 : cmp;
          });
          setRows(out);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [address, client]);

  return (
    <div className={cx("w-full", className)}>
      <div className="bg-base-100 rounded-2xl border border-base-content/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-base-content">Your borrows</h2>
          <span className="text-xs text-base-content/50 font-mono bg-base-200 px-3 py-1 rounded-full">
            {shorten(address)}
          </span>
        </div>

        {loading && <div className="mt-3 text-sm text-base-content/60">Načítám tvoje borrow pozice…</div>}
        {error && (
          <div className="mt-3 px-4 py-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
            Chyba: {String(error)}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="mt-3 text-sm text-base-content/60 text-center py-8">
            <p>Žádné aktivní borrows.</p>
            <p className="text-xs text-base-content/40 mt-2">Supply assets on Aave to enable borrowing</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="mt-4 divide-y divide-base-content/10 border border-base-content/10 rounded-xl overflow-hidden">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-base-200/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-sm font-bold text-primary">
                    {r.symbol.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-base-content">{r.symbol}</div>
                    <div className="text-sm text-base-content/50 font-mono">
                      {fmt2(r.amountToken)} {r.symbol}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => console.log(`Take insurance for ${r.symbol}`)}
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function shorten(addr?: string) {
  if (!addr) return "";
  const a = getAddress(addr as `0x${string}`);
  return a.slice(0, 6) + "…" + a.slice(-4);
}
function fmt2(x: string) {
  try {
    const b = new Big(x);
    return b.gte(1) ? b.toFixed(2) : b.toPrecision(2);
  } catch {
    return x;
  }
}

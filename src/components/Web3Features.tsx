"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  WalletMinimal,
  Network,
  Receipt,
  Link,
  WalletCards,
  Pocket,
  EthernetPort,
} from "lucide-react";

type Hex = `0x${string}`;

type NetworkOption = {
  key: "ethereum" | "polygon";
  label: string;
  chainId: number;
  hexChainId: Hex;
  currency: "ETH" | "MATIC";
  rpcHint: string;
  colorClass: string; // subtle accent for labels
};

const NETWORKS: NetworkOption[] = [
  {
    key: "ethereum",
    label: "Ethereum",
    chainId: 1,
    hexChainId: "0x1",
    currency: "ETH",
    rpcHint: "Mainnet",
    colorClass: "text-chart-4",
  },
  {
    key: "polygon",
    label: "Polygon",
    chainId: 137,
    hexChainId: "0x89",
    currency: "MATIC",
    rpcHint: "Mainnet",
    colorClass: "text-chart-3",
  },
];

function mergeClassNames(a?: string, b?: string) {
  if (a && b) return a + " " + b;
  return a || b || "";
}

function formatAddress(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function isHex(value: string): value is Hex {
  return /^0x[0-9a-fA-F]*$/.test(value);
}

function toHexWei(amount: string): Hex | null {
  // Convert decimal string to wei using BigInt math; supports up to 18 decimals
  if (!amount || isNaN(Number(amount))) return null;
  const [intPart, decPartRaw = ""] = amount.split(".");
  const decPart = decPartRaw.slice(0, 18); // trim to 18 decimals
  const pad = 18 - decPart.length;
  const weiStr = `${intPart}${decPart}${"0".repeat(pad)}`.replace(/^0+/, "") || "0";
  try {
    const wei = BigInt(weiStr);
    return ("0x" + wei.toString(16)) as Hex;
  } catch {
    return null;
  }
}

function pad32(hexWithout0x: string) {
  return hexWithout0x.padStart(64, "0");
}

function tokenIdToArg(tokenId: string): string | null {
  try {
    const bi = BigInt(tokenId);
    return pad32(bi.toString(16));
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] | object }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export interface Web3FeaturesProps {
  className?: string;
  style?: React.CSSProperties;
  // Addresses to receive tips; if not provided, tipping will be disabled for that network
  tipAddressEthereum?: string; // checksummed 0x...
  tipAddressPolygon?: string;  // checksummed 0x...
  // Optional default tip values
  defaultTipEth?: string; // e.g., "0.01"
  defaultTipMatic?: string; // e.g., "5"
}

export default function Web3Features({
  className,
  style,
  tipAddressEthereum,
  tipAddressPolygon,
  defaultTipEth = "0.01",
  defaultTipMatic = "5",
}: Web3FeaturesProps) {
  const [hasProvider, setHasProvider] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Tip state
  const [tipNetworkKey, setTipNetworkKey] = useState<NetworkOption["key"]>("ethereum");
  const [tipAmount, setTipAmount] = useState<string>("");
  const [sendingTip, setSendingTip] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [txProgress, setTxProgress] = useState<number>(0);
  const txPoller = useRef<number | null>(null);

  // Ownership proof state
  const [proofNetworkKey, setProofNetworkKey] = useState<NetworkOption["key"]>("ethereum");
  const [contractAddress, setContractAddress] = useState<string>("");
  const [tokenId, setTokenId] = useState<string>("");
  const [checkingOwner, setCheckingOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [ownershipMatch, setOwnershipMatch] = useState<boolean | null>(null);

  const tipNetwork = useMemo(
    () => NETWORKS.find((n) => n.key === tipNetworkKey)!,
    [tipNetworkKey]
  );
  const proofNetwork = useMemo(
    () => NETWORKS.find((n) => n.key === proofNetworkKey)!,
    [proofNetworkKey]
  );

  const tipRecipient = useMemo(() => {
    return tipNetwork.key === "ethereum" ? tipAddressEthereum : tipAddressPolygon;
  }, [tipNetwork, tipAddressEthereum, tipAddressPolygon]);

  const currentCurrency = tipNetwork.currency;

  // Initialize tip amount defaults based on selected network
  useEffect(() => {
    setTipAmount(tipNetwork.key === "ethereum" ? defaultTipEth : defaultTipMatic);
  }, [tipNetwork.key, defaultTipEth, defaultTipMatic]);

  // Detect provider
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setHasProvider(true);
    } else {
      setHasProvider(false);
    }
  }, []);

  // Subscribe to account/chain changes
  useEffect(() => {
    if (!hasProvider || !window.ethereum?.on) return;

    const handleAccountsChanged = (accs: string[]) => {
      const addr = accs?.[0] || null;
      setAccount(addr);
      if (!addr) {
        setTxHash(null);
        setOwnershipMatch(null);
        setOwnerAddress(null);
      }
    };
    const handleChainChanged = (hexId: string) => {
      try {
        const id = parseInt(hexId, 16);
        setChainId(Number.isFinite(id) ? id : null);
      } catch {
        setChainId(null);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [hasProvider]);

  const isConnected = !!account;

  const ensureChain = useCallback(
    async (desired: NetworkOption) => {
      if (!window.ethereum) throw new Error("Wallet provider not found.");
      const currentHex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      if (currentHex?.toLowerCase() === desired.hexChainId.toLowerCase()) {
        return;
      }
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: desired.hexChainId }],
        });
      } catch (err: any) {
        // 4902 means the chain is not added to wallet
        if (err?.code === 4902) {
          // For Polygon mainnet, we can suggest add; for Ethereum, wallets should have it.
          if (desired.key === "polygon") {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x89",
                    chainName: "Polygon Mainnet",
                    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                    rpcUrls: ["https://polygon-rpc.com"],
                    blockExplorerUrls: ["https://polygonscan.com"],
                  },
                ],
              });
              return;
            } catch {
              throw new Error("Please add Polygon network to your wallet.");
            }
          }
        }
        throw new Error("Please switch your wallet to the correct network.");
      }
    },
    []
  );

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("No wallet found", {
        description: "Install MetaMask or a compatible wallet to continue.",
      });
      return;
    }
    setConnecting(true);
    try {
      const accs = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const addr = accs?.[0];
      if (!addr) throw new Error("Wallet did not provide an account.");
      setAccount(addr);
      const hexId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const id = parseInt(hexId, 16);
      setChainId(Number.isFinite(id) ? id : null);
      toast.success("Wallet connected", { description: formatAddress(addr) });
    } catch (err: any) {
      const message =
        err?.message?.includes("User rejected")
          ? "Connection request rejected."
          : "Failed to connect wallet.";
      toast.error("Connection error", { description: message });
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // EIP-1193 wallets generally don't support programmatic disconnect; clear UI state.
    setAccount(null);
    setChainId(null);
    setTxHash(null);
    setOwnershipMatch(null);
    setOwnerAddress(null);
    toast("Disconnected", { description: "Wallet state cleared in this app." });
  }, []);

  const sendTip = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("No wallet found", {
        description: "Please install MetaMask or a compatible wallet.",
      });
      return;
    }
    if (!isConnected || !account) {
      toast.error("Not connected", { description: "Connect your wallet first." });
      return;
    }
    if (!tipRecipient) {
      toast.error("Recipient unavailable", {
        description: `Tipping address for ${tipNetwork.label} is not configured.`,
      });
      return;
    }
    const valueHex = toHexWei(tipAmount);
    if (!valueHex) {
      toast.error("Invalid amount", { description: "Enter a valid number." });
      return;
    }

    setSendingTip(true);
    setTxHash(null);
    setTxProgress(10);

    try {
      await ensureChain(tipNetwork);
      setTxProgress(25);

      const txParams = {
        from: account,
        to: tipRecipient,
        value: valueHex,
      };

      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      })) as Hex;

      setTxHash(hash);
      setTxProgress(50);
      toast("Transaction sent", { description: `Hash: ${hash.slice(0, 10)}...` });

      // Poll for receipt
      let progress = 55;
      const poll = async () => {
        try {
          const receipt = await window.ethereum!.request({
            method: "eth_getTransactionReceipt",
            params: [hash],
          });
          progress = Math.min(progress + 7, 94);
          setTxProgress(progress);
          if (receipt) {
            setTxProgress(100);
            if (receipt.status === "0x1" || receipt.status === 1) {
              toast.success("Tip confirmed", { description: "Thank you!" });
            } else {
              toast.error("Transaction failed", { description: "The transaction was reverted." });
            }
            if (txPoller.current) {
              window.clearInterval(txPoller.current);
              txPoller.current = null;
            }
          }
        } catch {
          // keep polling silently
        }
      };
      // @ts-ignore - setInterval returns number in browsers
      txPoller.current = window.setInterval(poll, 1500);
    } catch (err: any) {
      const description =
        err?.code === 4001
          ? "User rejected the transaction."
          : err?.message || "Failed to send transaction.";
      toast.error("Transaction error", { description });
      setTxHash(null);
      setTxProgress(0);
    } finally {
      setSendingTip(false);
    }
  }, [account, ensureChain, isConnected, tipAmount, tipNetwork, tipRecipient]);

  useEffect(() => {
    return () => {
      if (txPoller.current) {
        window.clearInterval(txPoller.current);
        txPoller.current = null;
      }
    };
  }, []);

  const quickAmounts = useMemo(() => {
    if (tipNetwork.key === "ethereum") {
      return ["0.005", "0.01", "0.025", "0.05"];
    }
    return ["1", "3", "5", "10"];
  }, [tipNetwork.key]);

  const canTip = !!tipRecipient && !!tipAmount && Number(tipAmount) > 0 && isConnected;

  const handleOwnershipCheck = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("No wallet found", {
        description: "Please install MetaMask or a compatible wallet.",
      });
      return;
    }
    if (!contractAddress || !isHex(contractAddress) || contractAddress.length !== 42) {
      toast.error("Invalid contract", { description: "Enter a valid ERC-721 contract address." });
      return;
    }
    const tokenArg = tokenIdToArg(tokenId);
    if (!tokenArg) {
      toast.error("Invalid token ID", { description: "Enter a valid numeric token ID." });
      return;
    }
    setCheckingOwner(true);
    setOwnerAddress(null);
    setOwnershipMatch(null);

    try {
      await ensureChain(proofNetwork);
      // method selector for ownerOf(uint256) = 0x6352211e
      const data = ("0x6352211e" + tokenArg) as Hex;

      const result = (await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: contractAddress,
            data,
          },
          "latest",
        ],
      })) as Hex;

      // Parse last 40 hex chars as address
      const clean = result.replace(/^0x/, "").padStart(64, "0");
      const addrHex = "0x" + clean.slice(-40);
      const normalized = addrHex.toLowerCase();
      setOwnerAddress(addrHex);

      if (account) {
        setOwnershipMatch(normalized === account.toLowerCase());
        if (normalized === account.toLowerCase()) {
          toast.success("Ownership verified", {
            description: `${formatAddress(addrHex)} owns token #${tokenId}`,
          });
        } else {
          toast("Owner differs", {
            description: `${formatAddress(addrHex)} is the owner`,
          });
        }
      } else {
        toast("Owner resolved", { description: formatAddress(addrHex) });
      }
    } catch (err: any) {
      const msg =
        err?.message?.includes("execution reverted")
          ? "Contract reverted. Ensure the contract is ERC-721 and token ID exists."
          : err?.message || "Failed to fetch owner.";
      toast.error("Ownership check failed", { description: msg });
      setOwnerAddress(null);
      setOwnershipMatch(null);
    } finally {
      setCheckingOwner(false);
    }
  }, [account, contractAddress, ensureChain, proofNetwork, tokenId]);

  const connectionStatus = useMemo(() => {
    const networkLabel =
      chainId === 1
        ? "Ethereum"
        : chainId === 137
        ? "Polygon"
        : chainId
        ? `Chain ${chainId}`
        : "Unknown";
    return isConnected ? `${networkLabel}` : "Disconnected";
  }, [chainId, isConnected]);

  return (
    <section
      className={mergeClassNames(
        "w-full max-w-full bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm",
        className
      )}
      style={style}
      aria-label="Web3 features"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            <h3 className="font-heading text-lg sm:text-xl">Web3</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            Connect your wallet, send a tip, and verify on-chain ownership of project NFTs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            <Network className="mr-1 size-3.5" aria-hidden="true" />
            {connectionStatus}
          </Badge>
          {isConnected ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                    className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Disconnect wallet"
                  >
                    <WalletMinimal className="mr-2 size-4" aria-hidden="true" />
                    {formatAddress(account!)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground border-border">
                  Disconnect wallet
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={connectMetaMask}
                disabled={connecting || !hasProvider}
                aria-disabled={connecting || !hasProvider}
              >
                <WalletCards className="mr-2 size-4" aria-hidden="true" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!hasProvider && (
        <Alert className="mt-4 bg-muted/40 border-border">
          <AlertTitle className="flex items-center gap-2">
            <EthernetPort className="size-4 text-primary" aria-hidden="true" />
            Wallet not detected
          </AlertTitle>
          <AlertDescription className="text-sm">
            Install MetaMask or a compatible EIP-1193 wallet to enable Web3 features.
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-5" />

      <Tabs defaultValue="tip" className="w-full">
        <TabsList className="grid grid-cols-2 sm:inline-flex bg-secondary/60">
          <TabsTrigger value="tip" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Pocket className="mr-2 size-4" aria-hidden="true" />
            Tip Me
          </TabsTrigger>
          <TabsTrigger value="ownership" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Link className="mr-2 size-4" aria-hidden="true" />
            Ownership Proof
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tip" className="mt-5">
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="network" className="flex items-center gap-2">
                  <Network className="size-4" aria-hidden="true" />
                  Network
                </Label>
                <Select
                  value={tipNetworkKey}
                  onValueChange={(v: NetworkOption["key"]) => setTipNetworkKey(v)}
                >
                  <SelectTrigger id="network" className="bg-secondary border-input">
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {NETWORKS.map((n) => (
                      <SelectItem key={n.key} value={n.key}>
                        <span className="flex items-center gap-2">
                          <span className={mergeClassNames("inline-block size-2 rounded-full", n.key === "ethereum" ? "bg-chart-4" : "bg-chart-3")} />
                          {n.label}
                          <span className="ml-2 text-xs text-muted-foreground">({n.rpcHint})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <Receipt className="size-4" aria-hidden="true" />
                  Amount
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="amount"
                    inputMode="decimal"
                    placeholder={`0.00 ${currentCurrency}`}
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="bg-secondary border-input"
                    aria-label={`Tip amount in ${currentCurrency}`}
                  />
                  <div className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                    {currentCurrency}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-secondary/50 hover:bg-secondary"
                      onClick={() => setTipAmount(amt)}
                    >
                      {amt} {currentCurrency}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm text-muted-foreground break-words">
                Recipient:{" "}
                <span className={mergeClassNames("font-medium", tipNetwork.key === "ethereum" ? "text-chart-4" : "text-chart-3")}>
                  {tipRecipient ? formatAddress(tipRecipient) : "Not configured"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={sendTip}
                        disabled={!canTip || sendingTip}
                        aria-disabled={!canTip || sendingTip}
                        className="min-w-[120px]"
                      >
                        <Pocket className="mr-2 size-4" aria-hidden="true" />
                        {sendingTip ? "Sending..." : "Send Tip"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-border">
                      {isConnected ? "Send a small on-chain tip" : "Connect your wallet first"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {txHash && (
              <div
                className="rounded-lg border border-border bg-secondary/40 p-4"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-primary" aria-hidden="true" />
                    <span className="text-sm">Transaction submitted</span>
                  </div>
                  <Badge variant="secondary" className="bg-muted/60">
                    {formatAddress(txHash)}
                  </Badge>
                </div>
                <Progress value={txProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Waiting for confirmations on {tipNetwork.label}...
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ownership" className="mt-5">
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="proof-network" className="flex items-center gap-2">
                  <Network className="size-4" aria-hidden="true" />
                  Network
                </Label>
                <Select
                  value={proofNetworkKey}
                  onValueChange={(v: NetworkOption["key"]) => setProofNetworkKey(v)}
                >
                  <SelectTrigger id="proof-network" className="bg-secondary border-input">
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {NETWORKS.map((n) => (
                      <SelectItem key={n.key} value={n.key}>
                        <span className="flex items-center gap-2">
                          <span className={mergeClassNames("inline-block size-2 rounded-full", n.key === "ethereum" ? "bg-chart-4" : "bg-chart-3")} />
                          {n.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract" className="flex items-center gap-2">
                  <Link className="size-4" aria-hidden="true" />
                  ERC-721 Contract
                </Label>
                <Input
                  id="contract"
                  placeholder="0x…"
                  inputMode="text"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value.trim())}
                  className="bg-secondary border-input"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tokenId" className="flex items-center gap-2">
                  <WalletMinimal className="size-4" aria-hidden="true" />
                  Token ID
                </Label>
                <Input
                  id="tokenId"
                  placeholder="e.g., 1"
                  inputMode="numeric"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value.replace(/[^\d]/g, ""))}
                  className="bg-secondary border-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Connected as:{" "}
                <span className="font-medium">{account ? formatAddress(account) : "—"}</span>
              </div>
              <Button
                onClick={handleOwnershipCheck}
                disabled={checkingOwner || !contractAddress || !tokenId}
                aria-disabled={checkingOwner || !contractAddress || !tokenId}
              >
                <Wallet className="mr-2 size-4" aria-hidden="true" />
                {checkingOwner ? "Checking..." : "Verify Ownership"}
              </Button>
            </div>

            {(ownerAddress || ownershipMatch !== null) && (
              <div className="rounded-lg border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <EthernetPort className="size-4 text-primary" aria-hidden="true" />
                    <span className="text-sm">Owner</span>
                  </div>
                  <Badge
                    className={mergeClassNames(
                      "uppercase",
                      ownershipMatch ? "bg-chart-3/20 text-chart-3" : "bg-muted/60"
                    )}
                  >
                    {ownershipMatch ? "You own this" : "Resolved"}
                  </Badge>
                </div>
                <p className="text-sm mt-2 break-words">
                  {ownerAddress ? ownerAddress : "—"}
                </p>
              </div>
            )}

            {!isConnected && (
              <Alert className="bg-muted/40 border-border">
                <AlertTitle className="flex items-center gap-2">
                  <Wallet className="size-4 text-primary" aria-hidden="true" />
                  Connect to verify
                </AlertTitle>
                <AlertDescription className="text-sm">
                  Connect your wallet to compare ownership against your address.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-5" />

      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center gap-1.5">
          <WalletCards className="size-3.5" aria-hidden="true" />
          EIP-1193 wallets supported (MetaMask and compatibles)
        </span>
        <span className="flex items-center gap-1.5">
          <Network className="size-3.5" aria-hidden="true" />
          Ethereum & Polygon Mainnets
        </span>
        <span className="flex items-center gap-1.5">
          <Receipt className="size-3.5" aria-hidden="true" />
          Real-time transaction status
        </span>
      </div>
    </section>
  );
}
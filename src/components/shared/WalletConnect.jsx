import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useStore } from "../../store/useStore";

const WalletConnect = () => {
  const user = useStore((s) => s.officer);
  const updateProfile = useStore((s) => s.updateProfile);
  const connectedAddress = user?.walletAddress;

  const fallbackAddress = useMemo(() => "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", []);

  if (!user) return null;

  if (!connectedAddress) {
    return (
      <Button className="w-full justify-start" size="sm" onClick={() => updateProfile({ walletAddress: fallbackAddress })}>
        <Wallet className="mr-2 h-4 w-4" /> Connect MetaMask
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-white/20 bg-white/5 p-2 text-xs text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Connected
        </div>
        <Badge className="bg-green-700/60 text-white">Hardhat</Badge>
      </div>
      <p className="mt-1 truncate font-mono">{connectedAddress}</p>
    </div>
  );
};

export default WalletConnect;

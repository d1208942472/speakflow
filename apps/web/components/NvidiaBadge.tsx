export function NvidiaBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-[#76B900]/10 border border-[#76B900]/30 rounded-full px-4 py-2">
      <span className="w-2 h-2 bg-[#76B900] rounded-full animate-pulse" />
      <span className="text-[#76B900] text-sm font-bold tracking-wide">
        Powered by NVIDIA AI
      </span>
    </div>
  )
}

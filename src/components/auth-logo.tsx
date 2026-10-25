import Image from "next/image"

export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src="/convora-icon-white.png"
        alt="Convora Reach"
        width={48}
        height={48}
        className="rounded-xl"
      />
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">Convora Reach</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Instagram DM Automation</p>
      </div>
    </div>
  )
}

export default function QRCode({ value }) {
  return (
    <div className="w-48 h-48 bg-white rounded-xl p-4">
      <div className="w-full h-full bg-slate-900 rounded flex items-center justify-center text-xs text-slate-500">
        QR: {value}
      </div>
    </div>
  )
}
export default function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Shield: guardian silhouette */}
      <path d="M12 2.5 4.5 5.2v6.1c0 4.6 3.1 8 7.5 10.2 4.4-2.2 7.5-5.6 7.5-10.2V5.2L12 2.5Z" />
      {/* Watchful eye inside the shield */}
      <path d="M7.6 11.4c1.2-2 2.7-3 4.4-3s3.2 1 4.4 3c-1.2 2-2.7 3-4.4 3s-3.2-1-4.4-3Z" />
      <circle cx="12" cy="11.4" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

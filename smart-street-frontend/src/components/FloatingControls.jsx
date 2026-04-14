export default function FloatingControls({ children, position = "bottom-right", className = "" }) {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2"
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-[1000] ${className}`}>
      {children}
    </div>
  );
}
import { motion } from "framer-motion";

const Skeleton = ({ className, variant = "text" }) => {
  const variants = {
    text: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  return (
    <motion.div
      className={`bg-slate-200 dark:bg-slate-700 ${variants[variant]} ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};

export default Skeleton;

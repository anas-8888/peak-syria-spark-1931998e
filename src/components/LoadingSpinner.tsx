const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-primary/40 border-t-transparent rounded-full animate-spin" 
          style={{ animationDirection: "reverse", animationDuration: "0.8s" }} 
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;

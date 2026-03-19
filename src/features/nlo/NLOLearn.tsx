import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "react-feather";

const slides = [
  {
    title: "Info screen 1",
    description: "Content to be finalised",
  },
  {
    title: "Info screen 2",
    description: "Content to be finalised",
  },
  {
    title: "Info screen 3",
    description: "Content to be finalised",
  },
];

const NLOLearn = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const isLast = activeSlide === slides.length - 1;

  function handleNext() {
    if (isLast) {
      navigate("/nlo-name-agent");
    } else {
      setActiveSlide((prev) => prev + 1);
    }
  }

  return (
    <div className="app-frame mx-auto bg-dark-bg flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        <h2 className="text-white text-[22px] font-medium text-center mb-2">
          {slides[activeSlide].title}
        </h2>
        <p className="text-txt-muted text-[13px] text-center leading-5">
          {slides[activeSlide].description}
        </p>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === activeSlide ? "bg-accent-blue" : "bg-dark-border"
            }`}
            onClick={() => setActiveSlide(i)}
          />
        ))}
      </div>

      {/* Next button */}
      <div className="px-5 pb-5 flex justify-end">
        {isLast ? (
          <button
            className="w-full btn-secondary text-sm py-3.5"
            onClick={() => navigate("/new-position")}
          >
            Create First Position
          </button>
        ) : (
          <button
            className="flex items-center gap-2 text-txt-secondary text-sm font-medium bg-dark-card border border-dark-border px-5 py-2.5 rounded-xl hover:bg-dark-surface"
            onClick={handleNext}
          >
            Next
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NLOLearn;

import { FC, memo } from "react";

const Tabs: FC<ITabsProps> = memo((props) => {
  return (
    <div className="w-full">
      <div className="flex items-center bg-dark-card border border-dark-border rounded-full p-1">
        {props.tabs.map((tab) => (
          <button
            key={tab}
            className={`flex-1 text-xs font-medium px-3 py-2 rounded-full transition-colors ${
              tab === props.activeTab
                ? "bg-[#2C323E] text-white"
                : "text-txt-muted hover:text-txt-secondary"
            }`}
            onClick={() => props.setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
});

export default Tabs;

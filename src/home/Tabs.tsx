import { FC, memo } from "react";

const Tabs: FC<ITabsProps> = memo((props) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        {props.tabs.map((tab) => (
          <button
            className={`text-[10px] font-medium px-2 py-1 rounded-md text-black hover:text-black hover:bg-XLightBlue ${
              tab == props.activeTab ? "bg-XLightBlue" : ""
            }`}
            onClick={() => props.setActiveTab(tab as Tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
});

export default Tabs;

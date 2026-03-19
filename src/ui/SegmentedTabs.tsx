import classNames from "classnames";

interface SegmentedTabsProps<T extends string> {
  tabs: T[];
  active: T;
  onChange: (tab: T) => void;
}

const SegmentedTabs = <T extends string>({
  tabs,
  active,
  onChange,
}: SegmentedTabsProps<T>) => {
  return (
    <div className="flex items-center bg-dark-card border border-dark-border rounded-full p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={classNames(
            "flex-1 text-[11px] font-medium px-3 py-2 rounded-full transition-colors",
            tab === active
              ? "bg-dark-surface text-white"
              : "text-txt-muted hover:text-txt-secondary"
          )}
          onClick={() => onChange(tab)}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default SegmentedTabs;

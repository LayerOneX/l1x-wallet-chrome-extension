import l1xHollowLogo from "./../assets/images/L1X-Animation.gif";
const Spalsh = () => {
  return (
    <div className="w-[375px] h-[600px] overflow-hidden mx-auto px-4 py-5 flex items-center justify-center bg-gradient absolute z-50">
      <div>
        <img src={l1xHollowLogo} className="w-32 h-32 " alt="logo" />
      </div>
    </div>
  );
};

export default Spalsh;

import AirdropDisplay from '@assets/images/AirdropChecker.png'
import { useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AppContext } from '../../../Auth.guard'
// import { getL1xXpRewards, claimAirdropXp } from '@util/Airdrop.service'
import Spinner from '@components/Spinner'

const AirdropCheckerButton = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!appContext?.publicKey || loading) return;

    try {
      setLoading(true);
      
      // First, fetch rewards to get the userUuid
      // const rewardsData = await getL1xXpRewards(appContext.publicKey);
      
      // if (rewardsData?.data) {
      //   const rewardData = rewardsData.data;
      //   // Handle both single object and array responses
      //   const rewards = Array.isArray(rewardData) ? rewardData : [rewardData];
        
      //   if (rewards.length > 0) {
      //     const firstReward = rewards[0];
      //     const userUuid = firstReward.uuid;
          
      //     // Check if already verified (verifyStatus !== 0 means verified)
      //     const isAlreadyVerified = firstReward.verifyStatus !== undefined && 
      //                                firstReward.verifyStatus !== null && 
      //                                firstReward.verifyStatus !== 0;
          
      //     // Call verification API - it will return "Already verified" if already verified
      //     if (!isAlreadyVerified && userUuid) {
      //       await claimAirdropXp(userUuid, appContext.publicKey);
      //       // If response says "Already verified", that's fine - page will show verified content
      //       // Response format: {status: "success", message: "Already verified.", data: null}
      //     }
      //   }
      // }
      
      // Navigate to airdrop eligibility page
      navigate("/airdrop-eligibility");
    } catch (error) {
      console.error("Error verifying eligibility:", error);
      // Still navigate even if there's an error
      navigate("/airdrop-eligibility");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      className='mb-3.5 relative' 
      onClick={handleClick}
      disabled={loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
          <Spinner />
        </div>
      )}
      <img src={AirdropDisplay} className="w-full" alt="Airdrop Checker"/>
    </button>
  )
}

export default AirdropCheckerButton
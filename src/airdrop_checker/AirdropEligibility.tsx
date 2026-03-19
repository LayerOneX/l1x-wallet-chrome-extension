import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useState, useEffect, useContext, useRef } from 'react'
// import { useRef, useCallback } from 'react' // Commented: used for claim history scroll functionality
import { useNavigate } from 'react-router-dom';
import classNames from "classnames";
import AirdropClaimSuccess from "./AirdropClaimSuccess";
import { AppContext } from "../Auth.guard";
import Spinner from "../components/Spinner";
import Swal from "sweetalert2";
import { XCircleIconHtml } from "../components/XCircleIconHtml";
import { getL1xXpRewards, claimAirdropXp } from "@util/Airdrop.service";
import { toFixedIfNeeded } from '@util/Helper';

// interface AirdropReward {
//   type: string;
//   eligible: boolean;
//   l1xpPoints?: number;
//   eligibleTokens?: number;
// }

// const airdropTypesMap: Record<string, { id: number; name: string }> = {
//   taskon: { id: 1, name: "Taskon Airdrop" },
//   galxe: { id: 2, name: "Galxe Airdrop" },
//   l1x: { id: 3, name: "L1X Airdrop" },
// };

interface AirdropReward {
  id?: number;
  name?: string;
  type?: string;
  xp: number;
  rewardAmount: number | string;
  uuid: string;
  verifyStatus?: number;
  claimedAt?: string;
  airdropLevel?: string;
  rank?: number;
}

interface ApiRewardResponse {
  uuid: string;
  xp: number;
  rank?: number;
  airdropLevel?: string;
  rewardAmount: number | string;
  verifyStatus?: number;
  claimedAt?: string;
  name?: string;
  type?: string;
  id?: number;
}

// Commented: Claim History related interface
// interface PaginationMeta {
//   total: number;
//   per_page: number;
//   current_page: number | null;
//   last_page: number;
//   first_page: number;
//   first_page_url: string;
//   last_page_url: string;
//   next_page_url: string | null;
//   previous_page_url: string | null;
// }

const AirdropEligibility = () => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);
  const [eligibleAirdropTypes, setEligibleAirdropTypes] = useState<AirdropReward[]>([]);
  const [selectedAirdropType, setSelectedAirdropType] = useState<AirdropReward | null>(null);
  // Commented: Claim History related state
  // const [airdropClaimHistory, setAirdropClaimHistory] = useState<AirdropReward[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const hasVerifiedSuccessfullyRef = useRef(false); // Track if API returned success (use ref to avoid closure issues)
  // const [loadingMore, setLoadingMore] = useState(false);
  // const [currentPage, setCurrentPage] = useState(1);
  // const [hasMorePages, setHasMorePages] = useState(false);
  // const scrollContainerRef = useRef<HTMLDivElement>(null);

  async function fetchRewards() {
    if (!appContext?.publicKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch eligible rewards
      const rewardsData = await getL1xXpRewards(appContext.publicKey);
      // Commented: Claim History - fetch in parallel
      // const [rewardsData, historyData] = await Promise.all([
      //   getL1xXpRewards(appContext.publicKey),
      //   getL1xClaimHistory(appContext.publicKey),
      // ]);

      // Process eligible rewards
      if (rewardsData?.data) {
        const rewardData = rewardsData.data;
        // Handle both single object and array responses
        const rewards: AirdropReward[] = Array.isArray(rewardData) ? rewardData : [rewardData];
        
        // Map API response to our interface format
        const mappedRewards = rewards.map((reward: ApiRewardResponse): AirdropReward => ({
          ...reward,
          name: reward.airdropLevel || reward.name || "Airdrop",
          rewardAmount: typeof reward.rewardAmount === 'string' ? reward.rewardAmount : String(reward.rewardAmount),
        }));
        
        // Filter for eligible rewards (verifyStatus === 0 means not claimed yet)
        // const eligibleRewards = mappedRewards.filter((reward: AirdropReward) => reward.verifyStatus === 0);
        
        setEligibleAirdropTypes(mappedRewards);
        
        if (mappedRewards.length > 0) {
          const firstReward = mappedRewards[0];
          setSelectedAirdropType(firstReward);
          // Check verification status from API response
          // verifyStatus === 0 means NOT verified, verifyStatus !== 0 means VERIFIED
          const isUserVerified = firstReward.verifyStatus !== undefined && 
                                  firstReward.verifyStatus !== null && 
                                  firstReward.verifyStatus !== 0;
          
          // CRITICAL: If API confirms verified (verifyStatus !== 0), ALWAYS set to verified
          // If API says not verified (verifyStatus === 0), check if we've successfully verified before
          // If hasVerifiedSuccessfullyRef.current is true, NEVER reset to false (API might not have updated yet)
          if (isUserVerified) {
            setIsVerified(true); // API confirms verified - always set to true
            hasVerifiedSuccessfullyRef.current = true; // Mark as successfully verified
          } else {
            // API says not verified - only set to false if we haven't verified successfully before
            if (hasVerifiedSuccessfullyRef.current) {
              setIsVerified(true); // Never reset if we've verified successfully
            } else {
              setIsVerified(false); // Only set to false if never verified
            }
          }
        } else {
          setSelectedAirdropType(null);
          setIsVerified(false);
        }
      } else {
        setEligibleAirdropTypes([]);
        setSelectedAirdropType(null);
      }

      // Commented: Claim History - Process claim history - API returns nested structure: data.data
      // if (historyData?.data?.data) {
      //   const history: AirdropReward[] = Array.isArray(historyData.data.data) 
      //     ? historyData.data.data 
      //     : [historyData.data.data];
      //   
      //   // Map API response to our interface format
      //   const mappedHistory = history.map((reward: ApiRewardResponse): AirdropReward => ({
      //     ...reward,
      //     name: reward.airdropLevel || reward.name || "Airdrop",
      //     rewardAmount: typeof reward.rewardAmount === 'string' ? reward.rewardAmount : String(reward.rewardAmount),
      //   }));
      //   
      //   // Sort claimed rewards by most recent first (if claimedAt exists)
      //   const sortedClaimedRewards = mappedHistory.sort((a: AirdropReward, b: AirdropReward) => {
      //     if (a.claimedAt && b.claimedAt) {
      //       return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
      //     }
      //     return 0;
      //   });
      //   
      //   setAirdropClaimHistory(sortedClaimedRewards);
      //   
      //   // Update pagination state
      //   const meta: PaginationMeta = historyData.data.meta;
      //   setCurrentPage(meta.current_page || 1);
      //   setHasMorePages(meta.next_page_url !== null);
      // } else {
      //   setAirdropClaimHistory([]);
      //   setHasMorePages(false);
      // }
    } catch (error) {
      Swal.fire({
        iconHtml: XCircleIconHtml,
        title: "Failed",
        text: "Failed to fetch airdrop eligibility. Please try again.",
        customClass: {
          icon: "no-border",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  // Commented: Claim History - Load more history function
  // const loadMoreHistory = useCallback(async () => {
  //   if (!appContext?.publicKey || loadingMore || !hasMorePages) return;

  //   try {
  //     setLoadingMore(true);
  //     const nextPage = currentPage + 1;
  //     const historyData = await getL1xClaimHistory(appContext.publicKey, nextPage);

  //     if (historyData?.data?.data) {
  //       const history: AirdropReward[] = Array.isArray(historyData.data.data) 
  //         ? historyData.data.data 
  //         : [historyData.data.data];
  //       
  //       // Map API response to our interface format
  //       const mappedHistory = history.map((reward: ApiRewardResponse): AirdropReward => ({
  //         ...reward,
  //         name: reward.airdropLevel || reward.name || "Airdrop",
  //         rewardAmount: typeof reward.rewardAmount === 'string' ? reward.rewardAmount : String(reward.rewardAmount),
  //       }));
  //       
  //       // Append new items to existing history
  //       setAirdropClaimHistory(prev => {
  //         const combined = [...prev, ...mappedHistory];
  //         // Sort all items by most recent first
  //         return combined.sort((a: AirdropReward, b: AirdropReward) => {
  //           if (a.claimedAt && b.claimedAt) {
  //             return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
  //           }
  //           return 0;
  //         });
  //       });
  //       
  //       // Update pagination state
  //       const meta: PaginationMeta = historyData.data.meta;
  //       setCurrentPage(meta.current_page || nextPage);
  //       setHasMorePages(meta.next_page_url !== null);
  //     }
  //   } catch (error) {
  //     console.error("Failed to load more claim history:", error);
  //   } finally {
  //     setLoadingMore(false);
  //   }
  // }, [appContext?.publicKey, loadingMore, hasMorePages, currentPage]);

  // Commented: Claim History - Handle scroll for infinite loading
  // const handleScroll = useCallback(() => {
  //   const container = scrollContainerRef.current;
  //   if (!container || loadingMore || !hasMorePages) return;

  //   const { scrollTop, scrollHeight, clientHeight } = container;
  //   // Load more when user is within 100px of the bottom
  //   if (scrollHeight - scrollTop - clientHeight < 100) {
  //     loadMoreHistory();
  //   }
  // }, [loadingMore, hasMorePages, loadMoreHistory]);

  // Commented: Claim History - Scroll event listener for infinite loading
  // useEffect(() => {
  //   const container = scrollContainerRef.current;
  //   if (container) {
  //     container.addEventListener('scroll', handleScroll);
  //     return () => container.removeEventListener('scroll', handleScroll);
  //   }
  // }, [handleScroll]);

  useEffect(() => {
    fetchRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appContext?.publicKey]);

  async function handleClaimTokens() {
    // Prevent verification if already verified - check both state and API response
    if (!selectedAirdropType || claiming || isVerified || !appContext?.publicKey) return;
    
    // IMPORTANT: Check verifyStatus from API response before calling verification API
    // If already verified (verifyStatus !== 0), don't call the API
    if (selectedAirdropType.verifyStatus !== undefined && 
        selectedAirdropType.verifyStatus !== null && 
        selectedAirdropType.verifyStatus !== 0) {
      // Already verified according to API - update state and return
      setIsVerified(true);
      return;
    }

    try {
      setClaiming(true);
      
      // Call API to verify eligibility
      const response = await claimAirdropXp(selectedAirdropType.uuid, appContext.publicKey);
      
      // Check response format: {status: "success", message: "...", data: ...}
      const responseStatus = response?.status || response?.success;
      const responseMessage = (response?.message || "").toLowerCase();
      
      // CRITICAL: If API returns status: "success", ALWAYS mark as verified
      // This applies whether it's a new verification OR "Already verified" message
      // Once API returns success, user should NEVER see "Verify Eligibility" button again
      const isSuccessStatus = responseStatus === "success" || responseStatus === true;
      const isAlreadyVerified = responseMessage.includes("already") || responseMessage.includes("verified");
      
      if (isSuccessStatus) {
        // API returned success - mark as verified immediately
        // CRITICAL: Set verified state and flag BEFORE refreshing data
        setIsVerified(true);
        hasVerifiedSuccessfullyRef.current = true; // Mark that API returned success
        setSelectedAirdropType(prev => prev ? { ...prev, verifyStatus: 1 } : null);
        
        // Only show modal if it's a new verification, not if already verified
        if (!isAlreadyVerified) {
          // Set transaction hash (using uuid as placeholder)
          setTransactionHash(selectedAirdropType?.uuid || "");
          // Open success modal only for new verifications
          setShowSuccessModal(true);
        }
        
        // Refresh data from API to get updated verifyStatus
        // Note: fetchRewards will preserve verified state because hasVerifiedSuccessfully is true
        await fetchRewards();
      } else {
        throw new Error(response?.message || "Verification failed");
      }
      
    } catch (error) {
      // If error indicates already verified, mark as verified
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes("already") || 
          errorMessage.toLowerCase().includes("verified")) {
        setIsVerified(true);
        hasVerifiedSuccessfullyRef.current = true; // Mark as verified
        setSelectedAirdropType(prev => prev ? { ...prev, verifyStatus: 1 } : null);
        // Don't show error modal if already verified, just update state
      } else {
        Swal.fire({
          iconHtml: XCircleIconHtml,
          title: "Failed",
          text: errorMessage || "Failed to verify eligibility. Please try again.",
          customClass: {
            icon: "no-border",
          },
        });
      }
    } finally {
      setClaiming(false);
    }
  }

  // function formatDate(dateString?: string): string {
  //   if (!dateString) return "";
  //   try {
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString("en-US", {
  //       year: "numeric",
  //       month: "short",
  //       day: "numeric",
  //       hour: "2-digit",
  //       minute: "2-digit",
  //     });
  //   } catch {
  //     return "";
  //   }
  // }

  return (
    <div className="AirdropCheckerWrapper app-frame mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-2 text-center">
        <button className="me-4" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="w-5 h-5 " />
        </button>
        Airdrop Eligibility
      </div>

      <div 
        // Commented: Claim History - scroll container ref removed
        // ref={scrollContainerRef}
        className="flex-grow-[1] overflow-y-auto"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : eligibleAirdropTypes.length === 0 ? (
          // Commented: Claim History - removed airdropClaimHistory.length === 0 check
          // ) : eligibleAirdropTypes.length === 0 && airdropClaimHistory.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-slate-500">No eligible airdrops found.</p>
          </div>
        ) : (
          <>
            {isVerified ? (
              // Success screen after verification
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <CheckCircleIcon className="w-16 h-16 text-green-500" />
                </div>
                  <h2 className="text-2xl font-bold text-XBlue mb-2">Verification Successful</h2>
                  <p className="text-sm text-slate-500">You have successfully verified your wallet.</p>
                </div>
                
                <div className="w-full bg-slate-100 rounded-lg p-4">
                  {selectedAirdropType?.airdropLevel && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Airdrop Level</p>
                      <p className="text-base font-bold text-XBlue">{selectedAirdropType.airdropLevel}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 border-t border-slate-300 pt-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">L1XP Points</p>
                      <p className="text-base font-bold text-XBlue">
                        {String(selectedAirdropType?.xp || 0).toLocaleString()} L1XP
                      </p>
                    </div>
                    <div className="w-px h-12 bg-slate-300"></div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Eligible L1X Tokens</p>
                      <p className="text-base font-bold text-XBlue">
                        {String(toFixedIfNeeded(Number(selectedAirdropType?.rewardAmount || 0), 4)).toLocaleString()} L1X
                      </p>
                    </div>
                  </div>
                </div>
                <div className='w-full text-center'>
                  <p className="text-base font-bold text-slate-700 mt-5">Eligibility confirmed!</p>
                  <p className="text-sm text-slate-700">Announcement coming soon.</p>
                </div>
              </div>
            ) : (
              // Initial view before verification
              <>
                {eligibleAirdropTypes.length > 0 && (
                  <>
                    <p className="mb-4 text-sm">Check your loyalty points earned through your participation.</p>

                    <div className="mb-4">
                      <p className="mb-2 text-sm text-XBlue font-semibold"> L1XP Points</p>
                      <input
                        type="text"
                        readOnly
                        value={`${String(selectedAirdropType?.xp || 0).toLocaleString()} L1XP`}
                        className="w-full px-4 py-3 border border-slate-200 rounded-md outline-none text-sm font-semibold bg-slate-200" />
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-sm text-XBlue font-semibold"> Eligible L1X Tokens</p>
                      <input
                        type="text"
                        readOnly
                        value={`${String(toFixedIfNeeded(Number(selectedAirdropType?.rewardAmount || 0), 4)).toLocaleString()} L1X`}
                        className="w-full px-4 py-3 border border-slate-200 rounded-md outline-none text-sm font-semibold bg-slate-200" />
                      <p className="text-xs text-slate-500 mt-2">Conversion based on current airdrop rules.</p>
                    </div>
                    
                    {selectedAirdropType?.airdropLevel && (
                      <div className="mb-6">
                        <p className="mb-2 text-sm text-XBlue font-semibold">Airdrop Level</p>
                        <input
                          type="text"
                          readOnly
                          value={selectedAirdropType.airdropLevel}
                          className="w-full px-4 py-3 border border-slate-200 rounded-md outline-none text-sm font-semibold bg-slate-200" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Commented: Claim History - Claim history display section
            {airdropClaimHistory.length > 0 && (
              <div className={classNames(eligibleAirdropTypes.length > 0 ? "mt-6 pt-6 border-t border-slate-200" : "")}>
                <h3 className="text-sm font-semibold text-XBlue mb-4">Claim History</h3>
                <div className="space-y-3">
                  {airdropClaimHistory.map((claimedReward) => (
                    <div
                      key={claimedReward.uuid}
                      className="flex items-center justify-between bg-slate-100 rounded-lg p-4"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="w-8 h-8 min-w-8 rounded-full border border-green-600 flex items-center justify-center me-3 bg-green-50">
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-black font-semibold text-sm truncate">
                            {claimedReward.airdropLevel || claimedReward.name || "Airdrop Claim"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <h6 className="text-[10px] font-medium text-green-600">Claimed</h6>
                            {claimedReward.claimedAt && (
                              <span className="text-[10px] text-slate-500">
                                • {formatDate(claimedReward.claimedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <h4 className="text-black text-sm font-semibold">
                          {String(toFixedIfNeeded(Number(claimedReward.rewardAmount || 0), 4)).toLocaleString()} L1X
                        </h4>
                        <h6 className="text-[10px] text-slate-500 mt-1">
                          {String(claimedReward.xp || 0).toLocaleString()} L1XP
                        </h6>
                      </div>
                    </div>
                  ))}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <Spinner />
                    </div>
                  )}
                  {!hasMorePages && airdropClaimHistory.length > 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400">No more claim history to load</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {eligibleAirdropTypes.length === 0 && airdropClaimHistory.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No eligible airdrops available at the moment.</p>
                <p className="text-xs text-slate-400 mt-2">Check back later for new rewards.</p>
              </div>
            )} */}
          </>
        )}
      </div>

      {!loading && eligibleAirdropTypes.length > 0 && !isVerified && (
        <div className="mt-5">
          <button
            className={classNames(
              claiming || !selectedAirdropType || isVerified ? "bg-XOrange/70 pointer-events-none" : "bg-XOrange",
              "flex items-center justify-center text-sm text-white px-3 py-2 rounded-3xl w-full min-h-[40px]"
            )}
            type="button"
            onClick={handleClaimTokens}
            disabled={claiming || !selectedAirdropType || isVerified}
          >
            {claiming ? (
              <>
                Verifying <Spinner />
              </>
            ) : (
              "Verify Eligibility"
            )}
          </button>
        </div>
      )}

      {showSuccessModal && (
        <AirdropClaimSuccess
          tokenAmount={`${String(toFixedIfNeeded(Number(selectedAirdropType?.rewardAmount || 0), 4)).toLocaleString()} L1X`}
          transactionHash={transactionHash}
          onClose={() => {
            setShowSuccessModal(false);
            // Refresh rewards to get updated verifyStatus from API
            fetchRewards();
          }}
        />
      )}
    </div>
  )
}

export default AirdropEligibility
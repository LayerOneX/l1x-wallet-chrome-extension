export async function getL1xXpRewards(l1xWalletAddress: string) {
  return (
    await fetch(
      "https://v2-api.l1xapp.com/api/v2/generals/l1x_fetchXUserXpRewards?walletAddress=" +
      l1xWalletAddress,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    )
  ).json();
}

export async function claimAirdropXp(userUuid: string, walletAddress: string) {
  return (
    await fetch(
      "https://v2-api.l1xapp.com/api/v2/generals/l1x_markXpAsVerified",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userUuid, walletAddress }),
      }
    )
  ).json();
}

export async function getL1xClaimHistory(l1xWalletAddress: string, page: number = 1) {
  return (
    await fetch(
      "https://v2-api.l1xapp.com/api/v2/generals/l1x_fetchXClaimHistory?walletAddress=" +
      l1xWalletAddress +
      "&page=" +
      page,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    )
  ).json();
}



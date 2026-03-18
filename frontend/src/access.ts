/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(initialState: { currentUser?: any } | undefined) {
  const { currentUser } = initialState ?? {};
  console.log("currentUser.username", currentUser?.username && currentUser?.username === "admin");
  return {
    canAdmin: currentUser?.username && currentUser?.username === "admin",
  };
}
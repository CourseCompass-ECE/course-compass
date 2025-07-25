import { Path } from "./enums";
import { LOGGED_IN } from "./constants";

export const checkUserLoggedIn = async (setIsUserLoggedIn) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BASE_URL}${Path.CHECK_CREDENTIALS}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      setIsUserLoggedIn(data?.message === LOGGED_IN);
      return data?.message === LOGGED_IN;
    } else {
      setIsUserLoggedIn(false);
      return false;
    }
  } catch (error) {
    setIsUserLoggedIn(false);
    return false;
  }
};

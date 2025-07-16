export const changeScroll = (
  increment,
  crsContainerRef,
  crsOuterContainerRefList,
  elementScrolledTo,
  setElementScrolledTo,
  coursesLength
) => {
  const newElementIndex = elementScrolledTo + increment;
  if (newElementIndex < 0 || newElementIndex >= coursesLength) return;

  crsContainerRef.current.scrollTo({
    left: crsOuterContainerRefList.current[newElementIndex].offsetLeft,
    behavior: "smooth",
  });
  setElementScrolledTo(newElementIndex);
};

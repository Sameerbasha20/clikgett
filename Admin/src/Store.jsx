import { create } from "zustand";
const initialState = {
    showNavbar: true,
    ActiveTab: "",
};
const useStore = create((set) => ({
    ...initialState,
    setshowNavbar: (auth) => set((state) => ({ ...state, showNavbar: auth })),
}));
export default useStore;

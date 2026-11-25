import Header from "./Header";
import Footer from "./Footer";
import Main from "./Main";
import { UserType } from "@/types/user";
import QuickPanel from "../widgets/QuickPanel";
import MobileBottomTabBar from "../widgets/MobileBottomTabBar";
import FloatingButtons from "../widgets/floatingButtons/FloatingButtons";

interface Props {
  user: UserType | null;

  children: React.ReactNode;
}

function LayoutSection({ children, user }: Props) {
  return (
    <>
      <Header user={user} />
      <Main>{children}</Main>
      <Footer />

      <QuickPanel />
      <MobileBottomTabBar />
      <FloatingButtons />
    </>
  );
}

export default LayoutSection;

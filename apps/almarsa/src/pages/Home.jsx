import { useEffect, useState } from "react";

import MarsahIntro from "../components/MarsahIntro";
import MarsahMenu from "./MarsahMenu";

function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [leavingIntro, setLeavingIntro] = useState(false);

  useEffect(() => {
    let removeTimer;

    const transitionTimer = setTimeout(() => {
      setLeavingIntro(true);

      removeTimer = setTimeout(() => {
        setShowIntro(false);
      }, 1600);
    }, 3000);

    return () => {
      clearTimeout(transitionTimer);

      if (removeTimer) {
        clearTimeout(removeTimer);
      }
    };
  }, []);

  return (
    <div className="site-shell">
      <MarsahMenu />

      {showIntro && (
        <MarsahIntro leaving={leavingIntro} />
      )}
    </div>
  );
}

export default Home;
import "../styles/marsah-intro.css";
import marsahLogo from "../assets/logos/marsah-logo.png";

function MarsahIntro({ leaving = false }) {
  return (
    <div className={`marsah-intro ${leaving ? "is-leaving" : ""}`}>
      <div className="marsah-intro-bg" aria-hidden="true">
        <span className="intro-light intro-light-one" />
        <span className="intro-light intro-light-two" />
        <span className="intro-horizon" />
      </div>

      <div className="marsah-intro-shell">
        <header className="intro-header">
          <span>AL MARSAH</span>
          <span className="intro-header-line" />
          <span>RESTAURANT</span>
        </header>

        <main className="intro-layout">
          <section className="intro-copy">
            <p className="intro-overline">THE MEDITERRANEAN, AT THE TABLE</p>

            <h1>
              Shaped
              <span>by the sea.</span>
            </h1>

            <p className="intro-description">
              A coastal dining experience built around fresh flavors,
              generous tables and the character of the Mediterranean.
            </p>

            <div className="intro-detail">
              <span className="intro-detail-line" />
              <span>AL MARSAH</span>
            </div>
          </section>

          <section className="intro-mark" aria-label="Al Marsah Restaurant">
            <div className="intro-mark-number" aria-hidden="true">01</div>

            <div className="intro-logo-stage">
              <img
                src={marsahLogo}
                alt="Al Marsah Restaurant"
                className="marsah-intro-logo"
              />
            </div>

            <p className="intro-tagline">A taste shaped by the sea</p>
          </section>
        </main>

        <footer className="intro-footer">
          <span>FRESH SEAFOOD</span>
          <span className="intro-footer-dot" />
          <span>LEBANESE TABLE</span>
          <span className="intro-footer-dot" />
          <span>MEDITERRANEAN</span>
        </footer>
      </div>

      <div className="intro-progress" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

export default MarsahIntro;

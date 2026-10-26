import marsahLogo from "../../assets/logos/marsah-logo.png";

export default function AboutSection({ language = "en" }) {
  const ar = language === "ar";
  return (
    <section className="marsah-story" id="about" lang={ar ? "ar" : "en"}>
      <div className="marsah-story-inner">
        <div className="marsah-story-header">
          <p className="marsah-story-eyebrow">ALMARSA RESTAURANT</p>
          <h1>{ar ? "قصّتنا" : "Our Story"}</h1>
          <p className="marsah-story-tagline">{ar ? "حيث تجد كل رحلة مرساها." : "Where Every Journey Finds Its Shore."}</p>
        </div>
        <div className="marsah-story-photo">
          <img src="/our-story-restaurant.jpg" alt={ar ? "إطلالة المطعم على البحر عند الغروب" : "ALMARSA seaside restaurant at sunset"} onError={(event) => { event.currentTarget.hidden = true; }} />
        </div>
        <article className="marsah-story-text">
          {ar ? (
            <>
              <h2>كل رحلة تستحق مكانًا ترسو فيه.</h2>
              <p>من جمال البحر الأبيض المتوسط اللامتناهي، استُلهمت فكرة المرسى: مكان تصل إليه الرحلات، وتجد فيه القلوب راحتها.</p>
              <p>كما تجد القوارب سكينتها عند المرفأ، يدعوكم المرسى إلى ترك صخب الحياة خلفكم والاستمتاع بجمال اللحظة.</p>
              <p>هنا، البحر ليس مجرد إطلالة؛ بل هو مصدر إلهامنا وروح تجربتنا.</p>
              <p>من نضارة أطباق البحر إلى دفء الضيافة اللبنانية، ندعوكم للاجتماع حول مائدة تجمع النكهات والذكريات واللحظات الجميلة.</p>
              <p>لأننا نؤمن أن أجمل الرحلات لا تُقاس فقط بالأماكن التي نزورها، بل بالأماكن التي نختار أن نبقى فيها.</p>
            </>
          ) : (
            <>
              <h2>Every journey deserves a place to anchor.</h2>
              <p>Inspired by the endless beauty of the Mediterranean Sea, ALMARSA was born from a simple idea: every journey deserves a destination where the heart feels at home.</p>
              <p>Just as boats find peace when they reach the harbor, ALMARSA invites you to leave the rush of the world behind and embrace the beauty of the moment.</p>
              <p>Here, the sea is more than a view. It is our inspiration, our atmosphere, and the soul of everything we create.</p>
              <p>From the freshness of our seafood to the warmth of Lebanese hospitality, every flavor is an invitation to gather, celebrate, and make memories that last beyond the sunset.</p>
              <p>Because at ALMARSA, we believe the most beautiful journeys aren't only about where you go, but where you choose to stay.</p>
            </>
          )}
          <div className="marsah-story-signature">
            <img src={marsahLogo} alt="ALMARSA" />
            <strong>{ar ? "المرسى — حيث يلتقي البحر بالروح." : "ALMARSA — Where the Sea Meets the Soul."}</strong>
            <span>{ar ? "نكهات طازجة. غروب ذهبي. ذكريات لا تُنسى." : "Fresh Flavors. Golden Sunsets. Timeless Memories."}</span>
          </div>
        </article>
      </div>
    </section>
  );
}

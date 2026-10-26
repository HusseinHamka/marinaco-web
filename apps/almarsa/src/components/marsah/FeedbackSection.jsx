import { useState } from "react";

import { apiUrl } from "../../publicPath.js";

export default function FeedbackSection({ language = "en" }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!rating || !contact.trim() || !message.trim()) {
      setError(
        language === "ar"
          ? "اختاري التقييم، واكتبي الإيميل أو رقم الهاتف، وأضيفي ملاحظتك."
          : "Please select a rating, add your email or phone number, and write your feedback.",
      );
      return;
    }

    setStatus("sending");
    setError("");

    try {
      const response = await fetch(apiUrl("/api/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          name,
          contact,
          message,
          website: "",
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        throw new Error("Delivery unavailable");
      }

      setStatus("sent");
      setMessage("");
      setName("");
      setContact("");
      setRating(0);
    } catch {
      setStatus("idle");
      setError(
        language === "ar"
          ? "الإرسال مش مفعّل حالياً. جرّبي لاحقاً."
          : "Could not submit feedback. Please try again later.",
      );
    }
  };

  return (
    <section className="v7-feedback" id="feedback">
      <div className="v7-feedback-inner">
        <div className="v7-feedback-copy">
          <p className="v7-section-kicker">{language === "ar" ? "تجربتك معنا" : "YOUR VISIT"}</p>
          <h2>{language === "ar" ? "كيف كانت تجربتك معنا؟" : <>How was your <span>sea-side moment?</span></>}</h2>
          <p>{language === "ar" ? "خبرنا عن الأكل والخدمة والأجواء" : "Food, service or atmosphere — tell us what stood out."}</p>
        </div>

        <form className="v7-feedback-card" onSubmit={submit}>
          <div className="v7-rating-block">
            <label>{language === "ar" ? "قيّم تجربتك" : "How was your experience?"}</label>
            <div className="v7-stars" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= rating ? "active" : ""}
                  onClick={() => setRating(star)}
                  aria-label={`${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="v7-field">
            <span>{language === "ar" ? "الاسم (اختياري)" : "Name (optional)"}</span>
            <input
              maxLength="80"
              value={name}
              onChange={(event) => setName(event.target.value)}
              type="text"
              placeholder={language === "ar" ? "اسمك" : "Your name"}
            />
          </label>

          <label className="v7-field">
            <span>{language === "ar" ? "الإيميل أو رقم الهاتف" : "Email or phone number"}</span>
            <input
              required
              maxLength="160"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              type="text"
              placeholder={language === "ar" ? "أدخل الإيميل أو رقم الهاتف" : "Enter your email or phone number"}
            />
          </label>

          <label className="v7-field">
            <span>{language === "ar" ? "ملاحظاتك" : "Your feedback"}</span>
            <textarea
              required
              maxLength="500"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={language === "ar" ? "خبرنا عن تجربتك..." : "Tell us about your experience..."}
            />
            <small>{message.length}/500</small>
          </label>

          {error && <p role="alert" className="marsah-feedback-error">{error}</p>}
          {status === "sent" && <p role="status" className="marsah-feedback-success">{language === "ar" ? "شكراً! وصلت ملاحظتك." : "Thank you! Your feedback was sent."}</p>}

          <button className="v7-submit" disabled={status === "sending"} type="submit">
            {status === "sending"
              ? (language === "ar" ? "عم نرسل..." : "Sending...")
              : (language === "ar" ? "إرسال التقييم" : "Send feedback")}
            <span>↗</span>
          </button>
        </form>
      </div>
    </section>
  );
}

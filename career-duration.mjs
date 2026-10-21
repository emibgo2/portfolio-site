export function formatCareerDuration(startMonth, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", year: "numeric", month: "numeric"
  }).formatToParts(now);
  const year = Number(parts.find(part => part.type === "year").value);
  const month = Number(parts.find(part => part.type === "month").value);
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const months = Math.max(0, (year - startYear) * 12 + month - startMonthNumber);
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return [years ? `${years}년` : "", remainder || !years ? `${remainder}개월` : ""].filter(Boolean).join(" ");
}

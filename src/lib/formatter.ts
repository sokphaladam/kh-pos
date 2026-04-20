import moment from "moment-timezone";
export class Formatter {
  static trimPhoneNumber(str: string): string {
    let phone = str.trim();

    if (phone.length > 8) {
      // prevent trimming 085 5....
      if (phone.substring(0, 4) == "+855") {
        phone = phone.substring(4); // +TRIM 855
      } else if (phone.substring(0, 3) == "855") {
        phone = phone.substring(3); // +TRIM 855
      }
    }

    phone = phone.replace(/^0/, ""); // TRIM 0

    return phone;
  }

  static dateTime(datetime: unknown): string | null {
    if (!datetime) return null;
    return moment(datetime).format("YYYY-MM-DD HH:mm");
  }

  static date(date: unknown): string | null {
    if (date === null) return null;
    return moment(date).format("YYYY-MM-DD");
  }

  static utc(): number {
    return (Date.now() / 1000) | 0;
  }

  static utcFromDate(date: Date | string | null | undefined) {
    if (!date) return null;
    return Math.floor(new Date(date).getTime() / 1000);
  }

  /**
   * Get the current time in +7 timezone
   */
  static getNowDateTime(): string {
    return moment().tz("Asia/Phnom_Penh").format("YYYY-MM-DD HH:mm:ss");
  }

  static getNowDate(): string {
    return moment().tz("Asia/Phnom_Penh").format("YYYY-MM-DD");
  }

  static getLast30DaysDateTime(): string {
    return moment()
      .subtract(30, "days")
      .tz("Asia/Phnom_Penh")
      .format("YYYY-MM-DD HH:mm:ss");
  }

  static addDateToNow(
    value: number,
    dateType: "day" | "month" | "year",
  ): string {
    return moment()
      .add(value, dateType)
      .tz("Asia/Phnom_Penh")
      .format("YYYY-MM-DD HH:mm:ss");
  }

  static phoneNumberMasking(number: string): string {
    const mask = "0" + number.substring(0, number.length - 4) + "xxxx";
    return mask.substring(0, 3) + " " + mask.substring(3, mask.length - 3);
  }

  static fullPhoneNumber(number: string): string {
    if (number[0] !== "+") return "+855" + number;
    return number;
  }

  static isBirthday(dob: string): boolean {
    let is_birthday = false;
    if (dob != null) {
      try {
        const from = moment(dob).add(-2, "days");
        const to = moment(dob).add(2, "days");
        is_birthday = moment
          .tz("Asia/Phnom_Penh")
          .isBetween(from, to, null, "[]");
      } catch (ex) {
        console.error(ex);
      }
    }
    return is_birthday;
  }

  static shuffle<T>(items: T[]): T[] {
    const array = [...items];

    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    return array;
  }

  static parseSafeJson(str: string | null | undefined) {
    if (!str) return {};
    try {
      const json = JSON.parse(str);
      return json;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {};
    }
  }

  static formatNumber = (n: number | undefined) => {
    if (!n) return n;
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
      useGrouping: false,
    }).format(n);
  };

  static formatCurrencyKH = (n: number | undefined) => {
    if (!n) return "៛0";
    return new Intl.NumberFormat("km-KH", {
      style: "currency",
      currency: "KHR",
      minimumFractionDigits: 0,
    })
      .format(n)
      .replace("KHR", "៛");
  };

  static autoFormatDateInput(
    raw: string,
    format: string = "dd/MM/yyyy",
  ): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8); // max 8 digits
    const separatorMatch = format.match(/[^A-Za-z]/g);
    const separator = separatorMatch ? separatorMatch[0] : "/";

    let result = "";
    let cursor = 0;

    // Day
    if (digits.length >= 1) {
      const day = digits.slice(cursor, cursor + 2);
      if (day.length === 2 && parseInt(day, 10) > 31) {
        return result; // invalid day
      }
      result += day;
      cursor += day.length;

      if (day.length === 2 && digits.length > cursor) {
        result += separator;
      }
    }

    // Month
    if (digits.length >= cursor + 1) {
      const month = digits.slice(cursor, cursor + 2);
      if (month.length === 2 && parseInt(month, 10) > 12) {
        return result; // invalid month
      }
      result += month;
      cursor += month.length;

      if (month.length === 2 && digits.length > cursor) {
        result += separator;
      }
    }

    // Year
    if (digits.length > cursor) {
      result += digits.slice(cursor);
    }

    return result;
  }

  static exchangeValue(value: number, currency: "USD" | "KHR", rate: number) {
    if (value === 0) {
      return {
        symbol: currency === "USD" ? "$" : "៛",
        amount: "0",
      };
    }

    if (currency === "USD") {
      return {
        symbol: "$",
        amount: (value / rate).toFixed(2),
      };
    }

    return {
      symbol: "៛",
      amount: new Intl.NumberFormat("km-KH", {
        style: "currency",
        currency: "KHR",
        minimumFractionDigits: 0,
      })
        .format(value * rate)
        .replace("KHR", ""),
    };
  }
}

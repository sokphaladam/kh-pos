// In CinemaHallService.createHall()
export const defaultFeatures = {
  visual: {
    imax: false,
    "3d": false,
    "4dx": false,
    screenx: false,
    dolby_cinema: false,
    laser_projection: false,
  },
  audio: {
    dolby_atmos: false,
    dts_x: false,
    thx_certified: false,
  },
  seating: {
    recliners: false,
    dbox: false,
    beds: false,
  },
  amenities: {
    in_seat_dining: false,
    vip_lounge: false,
    bar_service: false,
  },
  specialty: {
    kids_cinema: false,
    adults_only: false,
    art_house: false,
  },
};

export const defaultExtraSeatPrices = {
  standard: 0,
  wheelchair: 0,
  vip: 2,
  couple: 3,
};

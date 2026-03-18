// @ts-ignore
/* eslint-disable */

declare namespace API {
  // 日志请求
  type LogReq = {
    date?: string;
    endate?: string;
    tosign?: string;
    fromsign?: string;
    frequency?: number;
    band?: string;
    method?: string;
    tosignal?: string;
    fromsignal?: string;
    topower?: number;
    frompower?: number;
    toantenna?: string;
    fromantenna?: string;
    todevice?: string;
    fromdevice?: string;
    toqth?: string;
    fromqth?: string;
    duration?: string;
    content?: string;
    country?: string;
  }
  // 日志API
  type Log = {
    [x: string]: JointContent;
    id?: number;
    date?: string;
    endate?: string;
    tosign?: string;
    fromsign?: string;
    frequency?: number;
    band?: string;
    method?: string;
    tosignal?: string;
    fromsignal?: string;
    topower?: number;
    frompower?: number;
    toantenna?: string;
    fromantenna?: string;
    todevice?: string;
    fromdevice?: string;
    toqth?: string;
    fromqth?: string;
    duration?: string;
    content?: string;
    country?: string;
    fromcountry?: string;
    address?: Address;
  };
  // 日志API（地理位置）
  type Address = {
    id?: number;
    name?: string;
    country?: string;
    prefix?: string;
    adif?: string;
    cqzone?: string;
    ituzone?: string;
    continent?: string;
    latitude?: string;
    longitude?: string;
    gmtoffset?: string;
    exactcallsign?: string;
  };
  // 个人信息API
  type User = {
    [x: string]: JointContent;
    data: any;
    id?: number;
    username?: string;
    password?: string;
    otp?: string;
    email?: string;
    callsign?: string;
    stationaddress?: string;
    name?: string;
    address?: string;
    city?: string;
    province?: string;
    code?: string;
    country?: string;
    avatar?: string;
    device?: string;
    antenna?: string;
    power?: string;
    gird?: string;
    cqzone?: string;
    ituzone?: string;
  };
  // 频率APi
  type Frequency = {
    id: number;
    name: string;
    type: string;
    receive_downlink: string;
    frequency_difference: string;
    transmit_uplink: string;
    subsone: string;
    addate: string;
  };
  // 统一返回接口
  type Response = {
    code: any;
    data: any;
    message: any;
  };
}

// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

export interface LoginParams {
  username: string;
  otp: string;
}
const token = localStorage.getItem('token');

export interface UserInfo {
  id: number;
  username: string;
  otp: string;
  email: string;
  callsign: string;
  stationaddress: string;
  name: string;
  address: string;
  city: string;
  province: string;
  code: string;
  country: string;
  avatar: string;
  device: string;
  antenna: string;
  power: string;
  gird: string;
  cqzone: string;
  ituzone: string;
}

export interface LoginResult {
  code: number;
  message: string;
  data: {
    token: string;
    user: UserInfo;
  };
}

export async function loginUser(params: LoginParams) {
  return request<LoginResult>('/api/v1/user/login', {
    method: 'POST',
    data: params,
  });
}

export async function getUserInfo() {
  return request<{
    code: number;
    message: string;
    data: UserInfo;
  }>('/api/v1/user/info', {
    method: 'GET',
  });
}

// 用户接口类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  callsign: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 日志接口类型定义
export interface Log {
  id: number;
  userId: number;
  date: string;
  tosign: string;
  fromsign: string;
  method: string;
  frequency: string;
  band: string;
  content?: string;
  createdAt?: string;
}

// 基础响应类型
export interface Response {
  code: number;
  message: string;
  data?: any;
}


/**
 * 添加用户
 * @param body 用户数据
 * @param options 其他选项
 */
export async function addUser(body: User, options?: { [key: string]: any }) {
  return request<Response>('/api/v1/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/**
 * 更新用户
 * @param id 用户ID
 * @param body 用户数据
 * @param options 其他选项
 */
export async function updateUser(
  id: number,
  body: Partial<User>,
  options?: { [key: string]: any },
) {
  return request<Response>(`/api/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/**
 * 删除用户
 * @param id 用户ID
 */
export async function deleteUser(id: number) {
  return request<Response>(`/api/v1/user/delete?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取用户日志
 * @param userId 用户ID
 * @param params 分页参数
 * @param options 其他选项
 */
export async function getUserLogs(id: string, options?: { [key: string]: any }) {
  const token = localStorage.getItem('token');
  const url = `/api/v1/user/log?id=${id}`;
  return request<any>(url, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    ...(options || {}),
  });
}

export async function getAllUsers(
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    message: string;
    data: User[];
  }>('/api/v1/user/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 删除用户日志
 * @param logId 日志ID
 */
export async function deleteUserLog(logId: number) {
  return request<Response>(`/api/v1/admin/logs/${logId}`, {
    method: 'DELETE',
  });
}

/**
 * 批量删除用户日志
 * @param userId 用户ID
 * @param logIds 日志ID数组
 */
export async function batchDeleteUserLogs(
  userId: number,
  logIds: number[],
) {
  return request<Response>(`/api/v1/admin/users/${userId}/logs/batch`, {
    method: 'DELETE',
    data: { ids: logIds },
  });
}

/**
 * 重置用户密码
 * @param userId 用户ID
 */
export async function resetUserPassword(userId: number) {
  return request<Response>(`/api/v1/admin/users/${userId}/reset-password`, {
    method: 'POST',
  });
}

/**
 * 更改用户状态
 * @param userId 用户ID
 * @param status 新状态
 */
export async function changeUserStatus(
  userId: number,
  status: 'active' | 'inactive' | 'pending',
) {
  return request<Response>(`/api/v1/admin/users/${userId}/status`, {
    method: 'PUT',
    data: { status },
  });
}


// aisdjioasjdioasjdioasjdioasdjioasd

/** 获取所有日志 GET /api/v1/log */
export async function getAllLog(
    params: {
          /** 当前的页码 */
          current?: number;
          /** 页面的容量 */
          pageSize?: number;
        },
    options?: { [key: string]: any },
) {
    return request<API.Log>('/api/v1/log', {
          method: 'GET',
          params: {
              ...params,
            },
          ...(options || {}),
    });
}

export async function getAllQSL(
    options?: { [key: string]: any },
) {
    return request<API.Log>('/api/v1/qsl', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          ...(options || {}),
    });
}

// 删除QSL卡
export async function deleteQSL(id: string) {
  return fetch(`/api/v1/qsl/delete?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  }).then(async (res) => {
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "删除失败");
    }
    return res.json();
  });
}


export async function uploadQSL(
  file: File,
  options?: { [key: string]: any },
) {
  const formData = new FormData();
  formData.append('file', file);

  return request<any>('/api/v1/qsl/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: formData,
    ...(options || {}),
  });
}

// 生成OTP
export async function generateOTP(
  email: string,
  options?: { [key: string]: any },
) {
  const url = `/api/v1/user/otp?email=${(email)}`;
  return request<any>(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    ...(options || {}),
  });
}

export async function userRegister(body: any, options?: {[key:string]:any}) {
    return request<any>('/api/v1/user/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: body,
          ...(options || {}),
    });
}

/** 添加一条日志 POST /api/v1/log/add */
export async function addLog(body: API.Log, options?: {[key:string]:any}) {
    return request<API.Log>('/api/v1/log/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: body,
          ...(options || {}),
    });
}
/** 删除一条日志 DELETE /api/v1/log/delete 参数为 id */
export async function deleteLog(id: number) {
     return request<API.Log>(`/api/v1/log/delete?id=${id}`, {
          method: 'DELETE',
     });
}
/** 编辑一条日志 PUT /api/v1/log/change */
export async function editLog(id: number, body: API.Log, options?: {[key:string]:any}) {
     return request<API.LogReq>(`/api/v1/log/change?id=${id}`, {
          method: 'PUT',
          headers: {
               'Content-Type': 'application/json',
          },
          data: body,
          ...(options || {}),
     });
}
/** 获取所有频率 GET /api/v1/frequency */
export async function getAllFrequency(options?: { [key: string]: any }) {
  const token = localStorage.getItem('token');
     return request<API.Frequency>('/api/v1/frequency', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          ...(options || {}),
     });
}
/** 删除一条频率 DELETE /api/v1/frequency/delete */
export async function deleteFrequency(id: number) {
  return request<API.Response>(`/api/v1/frequency/delete?id=${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
  });
}
/** 编辑一条频率 PUT /api/v1/frequency/change */
export async function editFrequency(id: number, body: API.Frequency, options?: {[key:string]:any}) {
  return request<API.LogReq>(`/api/v1/frequency/change?id=${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  data: body,
  ...(options || {}),
  });
}
/** 添加一条频率 POST /api/v1/frequency/add */
export async function addFrequency(body: API.Frequency, options?: {[key:string]:any}) {
  return request<API.Response>('/api/v1/frequency/add', {
  method: 'POST',
  headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
  },
  data: body,
  ...(options || {}),
  });
}


/** 获取个人信息 GET /api/v1/user */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: any;
  }>('/api/v1/user/current', {
    method: 'GET',
    ...(options || {}),
  });
}
/** 登录接口 POST /api/v1/login */
export async function login(body: any, options?: { [key: string]: any }) {
  return request<any>('/api/v1/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
/** 修改个人信息 PUT /api/v1/user/change */
export async function changeUserInfo(id: number, body: API.User, options?: {[key:string]:any}) {
  return request<API.Response>(`/api/v1/user/change?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
/** 导出日志 GET /api/v1/log/output */
export async function outputLog(format: string) {
  return request<API.Response>(`/api/v1/log/output?format=${format}`, {
      method: 'GET',
  });
}

/** 退出登录 GET /api/v1/user/logout */
export async function logOut(options?: { [key: string]: any }) {
     return request<Record<string, any>>('/api/v1/user/logout', {
          method: 'GET',
          ...(options || {}),
     });
}
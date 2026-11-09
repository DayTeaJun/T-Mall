"use server";

import {
  createServerSupabaseAdminClient,
  createActionSupabaseClient,
} from "@/lib/config/supabase/server/server";
import { SignUpFormData, UserProfileType } from "@/types/user";
import { extractFilePathFromUrl } from "../utils/supabaseStorageUtils";
import { Database } from "../config/supabase/types_db";
import { DeliveryAddressForm } from "@/app/(member)/mypage/delivery/regist/page";

// 회원가입
export async function signUpUser(formData: SignUpFormData) {
  const supabase = await createActionSupabaseClient();

  const { email, password, username, phone } = formData;

  if (!email || !password || !username || !phone) {
    throw new Error("필수 입력값이 누락되었습니다.");
  }
  const formatPhoneWithHyphen = (value: string) => {
    if (value.length !== 11) return value;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  const formattedPhone = formatPhoneWithHyphen(phone.replace(/[^0-9]/g, ""));

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const { error: insertError } = await supabase.from("user_table").upsert({
      id: data.user.id,
      user_name: username,
      email,
      phone: formattedPhone,
      level: 1,
    });

    if (insertError) throw insertError;
  }

  return data.user;
}

// 소셜 로그인 (회원가입)
export async function signUpOAuth(formData: SignUpFormData) {
  const supabase = await createActionSupabaseClient();
  type UserInsert = Database["public"]["Tables"]["user_table"]["Insert"];

  if (!formData.id) {
    throw new Error("OAuth 회원가입에는 ID가 필요합니다.");
  }

  const { id, email, username, phone, address, profile_image_url } = formData;

  const payload: UserInsert = {
    id,
    email: email ?? null,
    user_name: username ?? null,
    phone: phone ?? "",
    address: address ?? "",
    profile_image_url: profile_image_url ?? null,
  };

  const { data, error } = await supabase
    .from("user_table")
    .upsert([payload], { onConflict: "id" });

  if (error) throw error;
  return data;
}

// 로그인
export async function signInUser(formData: {
  email: string;
  password: string;
}) {
  const supabase = await createActionSupabaseClient();

  const { email, password } = formData;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error("INVALID_CREDENTIALS");
  }

  await supabase
    .from("user_table")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  return data.user;
}

// 이메일 중복 체크 (rls 정책으로 인해 admin client 사용)
export async function serverCheckEmailExists(email: string) {
  const supabaseAdmin = await createServerSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("user_table")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Supabase 에러", error);
    throw new Error("이메일 중복 확인 실패");
  }

  return data !== null;
}

// 내 프로필 조회
export async function getMyProfile(userId: string) {
  const supabaseAdmin = await createServerSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("user_table")
    .select(
      `
    id, email, user_name, level, phone, profile_image_url, 
    created_at, updated_at, status, last_login_at, address
  `,
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase 에러", error);
    throw new Error("프로필 조회 실패");
  }

  return data;
}

// 내 배송지 조회
export async function getMyAddressList(userId: string) {
  const supabaseAdmin = await createActionSupabaseClient();

  const { data, error } = await supabaseAdmin
    .from("delivery_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });

  if (error) {
    console.error("Supabase 에러", error);
    throw new Error("배송지 조회 실패");
  }

  return data;
}

export async function getMyDefaultAddress(userId: string) {
  const supabaseAdmin = await createActionSupabaseClient();

  const { data, error } = await supabaseAdmin
    .from("delivery_addresses")
    .select("*")
    .eq("is_default", true)
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .single();

  if (error) {
    console.error("Supabase 에러", error);
    throw new Error("기본 배송지 조회 실패");
  }

  return data;
}

// 내 배송지 기본 배송지로 설정
export async function postDefaultDeliveryAddress(
  addressId: string,
  userId: string,
) {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  try {
    await supabase
      .from("delivery_addresses")
      .update({ is_default: true })
      .eq("user_id", userId)
      .eq("id", addressId);
  } catch (error) {
    console.error("기본 배송지 설정 에러:", error);
    throw new Error("기본 배송지 설정 중 오류가 발생했습니다.");
  }
}

// 내 배송지 등록
export async function postDeliveryAddress(formData: DeliveryAddressForm) {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  try {
    const { data, error } = await supabase
      .from("delivery_addresses")
      .insert([
        {
          ...formData,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("배송지 등록 에러:", error);
      throw new Error("배송지 등록 중 오류가 발생했습니다.");
    }

    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

// 내 배송지 수정
export async function patchDeliveryAddress(
  addressId: string,
  formData: DeliveryAddressForm,
) {
  const supabase = await createActionSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  try {
    const { data, error } = await supabase
      .from("delivery_addresses")
      .update(formData)
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("배송지 수정 에러:", error);
      throw new Error("배송지 수정 중 오류가 발생했습니다.");
    }

    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

// 내 배송지 삭제
export async function delDeliveryAddress(addressId: string) {
  const supabase = await createActionSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("인증되지 않은 사용자입니다.");
  }
  try {
    const { data, error } = await supabase
      .from("delivery_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("배송지 삭제 에러:", error);
      throw new Error("배송지 삭제 중 오류가 발생했습니다.");
    }

    return { success: true, data };
  } catch (err) {
    console.error(err);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

// 내 프로필 수정
export async function updateMyProfile({
  id,
  user_name,
  phone,
  profile_image_url,
}: UserProfileType) {
  const bucket = process.env.NEXT_PUBLIC_STORAGE_USER_BUCKET;
  const supabase = await createActionSupabaseClient();

  // 현재 저장된 프로필 이미지 URL 조회
  const { data: currentData, error } = await supabase
    .from("user_table")
    .select("profile_image_url")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Supabase 에러", error);
    throw new Error("프로필 조회 실패");
  }

  const currentImageUrl = currentData?.profile_image_url;

  // 기존 이미지와 다를 경우에만 삭제
  if (currentImageUrl && currentImageUrl !== profile_image_url && bucket) {
    const oldImagePath = extractFilePathFromUrl(currentImageUrl, bucket);
    if (oldImagePath) {
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove([oldImagePath]);

      if (removeError) {
        console.warn("기존 프로필 이미지 삭제 실패:", removeError.message);
      }
    }
  }

  // 유저 정보 업데이트
  const { data: updatedData, error: updateError } = await supabase
    .from("user_table")
    .update({
      user_name,
      phone,
      profile_image_url,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("프로필 업데이트 실패:", updateError.message);

    if (updateError.code === "23505") {
      throw new Error("이미 사용 중인 이름입니다. 다른 이름을 입력해 주세요.");
    }

    throw new Error("프로필 업데이트 실패");
  }

  return updatedData;
}

// 회원 탈퇴
export const withdrawalUser = async () => {
  const supabase = await createActionSupabaseClient();
  const adminClient = await createServerSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인된 사용자가 없습니다.");
  }

  await supabase.from("user_table").delete().eq("id", user.id);

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`회원 탈퇴 실패: ${error.message}`);
  }

  return { success: true };
};

// 문의 삭제
export async function deleteInquiry(
  inquiryId: number,
  guestPassword?: string,
  isAdmin: boolean = false,
) {
  const supabase = await createActionSupabaseClient();

  const removeImages = async (imageUrls: string[] | null) => {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
      const pathsToDelete = imageUrls
        .map((url: string) => {
          const parts = url.split("/inquiry-images/");
          return parts.length > 1 ? decodeURIComponent(parts[1]) : null;
        })
        .filter((path): path is string => !!path);

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("inquiry-images")
          .remove(pathsToDelete);

        if (storageError) {
          console.error("스토리지 파일 삭제 실패:", storageError.message);
        }
      }
    } catch (storageErr) {
      console.error("스토리지 파싱 및 삭제 중 오류:", storageErr);
    }
  };

  if (!isAdmin && guestPassword?.trim()) {
    const { data, error } = await supabase
      .rpc("delete_inquiry_with_password", {
        p_inquiry_id: inquiryId,
        p_password: guestPassword.trim(),
      })
      .single();

    if (error) throw error;
    if (!data?.success) throw new Error("비밀번호가 일치하지 않습니다.");

    await removeImages(data.image_urls);

    return { success: true };
  }

  const { data: original, error: fetchError } = await supabase
    .from("inquiries")
    .select("user_id, image_urls")
    .eq("id", inquiryId)
    .single();

  if (fetchError || !original) throw new Error("존재하지 않는 게시글입니다.");

  if (!isAdmin) {
    if (!original.user_id) {
      throw new Error("비회원 글 삭제를 위해 비밀번호가 필요합니다.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || original.user_id !== user.id) {
      throw new Error("본인이 작성한 글만 삭제할 수 있습니다.");
    }
  }

  await removeImages(original.image_urls);

  const { error: deleteError } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", inquiryId);

  if (deleteError) throw deleteError;

  return { success: true };
}

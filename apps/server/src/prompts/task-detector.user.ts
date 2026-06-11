// 待办识别的 user 消息模板
export interface BuildTaskDetectorUserMessageParams {
  occurredAt: Date;
  personName: string;
  contextText: string;
  newText: string;
  existingTasksText?: string;
}

export function buildTaskDetectorUserMessage(params: BuildTaskDetectorUserMessageParams): string {
  return `当前时间（UTC）：${params.occurredAt.toISOString()}
当前时间（北京时间，UTC+8）：${params.occurredAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}
聊天对象：${params.personName}

注意：所有 due_at 请用 UTC（ISO 8601，末尾带 Z），不要用北京时间。例如北京时间 14:00 = 06:00Z。

当前未完成待办（注意每条前面 [id:xxx] 是任务的真实 id，update 时必须原样回传）：
${params.existingTasksText?.trim() || "（无）"}

最近上下文：
${params.contextText}

本次新增消息：
${params.newText}

请判断本次新增消息是否让一个与我直接相关的待办/提醒**新成立或对已有待办做更具体的更新**。三种 action：
- action=create：新增消息让一件与「我」/聊天对象直接相关的新事项明确成立。"当前未完成待办"里没有同一人/同一件事/同一时间的旧任务。
- action=update：当前未完成待办里已有一条同类（同一对象/同一件事/同一未完成流程），本次新增消息给这条**补充了更具体的信息**（更明确的时间/地点/细节/意图调整）。把 update_target_id 设为那条任务的 id，title/due_at/description 用新更明确的内容。
- action=none：闲聊式确认、对方没有补充新信息、或事件跟「我」无关。

典型应 create：维修师傅说明天过来、对方约定某个时间来、双方约见面/电话/处理事情。典型应 update：先有「今天带猫去体检」+ 现在说「下午三点您看行不行」+ 我说「好的」。典型应 none：朋友说他被约周日复试、朋友吐槽老板/公司、我只是评论「怎么还周日面试」、对方只说「好的/OK」没新信息。不要描述这是微信/聊天/截图/屏幕界面；只抽取聊天语义里的待办。description 没有必要就留空，evidence 只放原始聊天句子。`;
}

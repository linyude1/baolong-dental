import { supabase } from '../config/supabase';
import { Patient, TreatmentRecord, Appointment, Medicine, ShoppingItem } from '../types';

// ============= 患者管理 =============

export const patientsApi = {
    // 获取所有患者
    async getAll(): Promise<Patient[]> {
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (patientsError) throw patientsError;

        // 为每个患者获取诊疗记录
        const patientsWithRecords = await Promise.all(
            (patients || []).map(async (patient) => {
                const { data: records } = await supabase
                    .from('treatment_records')
                    .select('*')
                    .eq('patient_id', patient.id)
                    .order('visit_date', { ascending: false });

                // 转换数据格式以匹配前端类型
                const latestRecord = records?.[0];
                return {
                    id: patient.id,
                    name: patient.name,
                    phone: patient.phone,
                    cardNumber: patient.card_number,
                    age: patient.age,
                    gender: patient.gender,
                    avatar: patient.avatar || `https://picsum.photos/seed/${patient.name}/200/200`,
                    visitDate: latestRecord?.visit_date,
                    time: latestRecord?.visit_time || '00:00',
                    status: latestRecord?.status || '待检查',
                    treatmentType: latestRecord?.treatment_type || '初诊',
                    desc: latestRecord?.description || '',
                    toothPos: latestRecord?.tooth_position,
                    imageUrl: latestRecord?.image_url,
                    records: records?.map(r => ({
                        id: r.id,
                        date: r.visit_date,
                        time: r.visit_time,
                        toothPos: r.tooth_position,
                        desc: r.description,
                        imageUrl: r.image_url
                    })) || []
                } as Patient;
            })
        );

        return patientsWithRecords;
    },

    // 获取单个患者
    async getById(id: string): Promise<Patient | null> {
        const { data: patient, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const { data: records } = await supabase
            .from('treatment_records')
            .select('*')
            .eq('patient_id', id)
            .order('visit_date', { ascending: false });

        const latestRecord = records?.[0];
        return {
            id: patient.id,
            name: patient.name,
            phone: patient.phone,
            cardNumber: patient.card_number,
            age: patient.age,
            gender: patient.gender,
            avatar: patient.avatar || `https://picsum.photos/seed/${patient.name}/200/200`,
            visitDate: latestRecord?.visit_date,
            time: latestRecord?.visit_time || '00:00',
            status: latestRecord?.status || '待检查',
            treatmentType: latestRecord?.treatment_type || '初诊',
            desc: latestRecord?.description || '',
            toothPos: latestRecord?.tooth_position,
            imageUrl: latestRecord?.image_url,
            records: records?.map(r => ({
                id: r.id,
                date: r.visit_date,
                time: r.visit_time,
                toothPos: r.tooth_position,
                desc: r.description,
                imageUrl: r.image_url
            })) || []
        } as Patient;
    },

    // 创建患者
    async create(patient: Omit<Patient, 'id'>): Promise<Patient> {
        // 先创建患者基本信息
        const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert([{
                name: patient.name,
                phone: patient.phone,
                card_number: patient.cardNumber,
                age: patient.age,
                gender: patient.gender,
                avatar: patient.avatar
            }])
            .select()
            .single();

        if (patientError) throw patientError;

        // 创建初始诊疗记录
        if (patient.desc) {
            await supabase
                .from('treatment_records')
                .insert([{
                    patient_id: newPatient.id,
                    visit_date: patient.visitDate || new Date().toISOString().split('T')[0],
                    visit_time: patient.time || '00:00',
                    treatment_type: patient.treatmentType,
                    tooth_position: patient.toothPos,
                    description: patient.desc,
                    status: patient.status,
                    image_url: patient.imageUrl
                }]);
        }

        return this.getById(newPatient.id) as Promise<Patient>;
    },

    // 更新患者
    async update(id: string, patient: Partial<Patient>): Promise<Patient> {
        const { error } = await supabase
            .from('patients')
            .update({
                name: patient.name,
                phone: patient.phone,
                card_number: patient.cardNumber,
                age: patient.age,
                gender: patient.gender,
                avatar: patient.avatar
            })
            .eq('id', id);

        if (error) throw error;

        // 如果有最新的诊疗信息，更新最新记录或创建新记录
        if (patient.desc || patient.status) {
            const { data: latestRecord } = await supabase
                .from('treatment_records')
                .select('*')
                .eq('patient_id', id)
                .order('visit_date', { ascending: false })
                .limit(1)
                .single();

            if (latestRecord) {
                await supabase
                    .from('treatment_records')
                    .update({
                        visit_date: patient.visitDate,
                        visit_time: patient.time,
                        treatment_type: patient.treatmentType,
                        tooth_position: patient.toothPos,
                        description: patient.desc,
                        status: patient.status,
                        image_url: patient.imageUrl
                    })
                    .eq('id', latestRecord.id);
            }
        }

        return this.getById(id) as Promise<Patient>;
    },

    // 删除患者
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============= 诊疗记录管理 =============

export const treatmentsApi = {
    // 为患者添加诊疗记录
    async create(patientId: string, record: Omit<TreatmentRecord, 'id'>): Promise<TreatmentRecord> {
        const { data, error } = await supabase
            .from('treatment_records')
            .insert([{
                patient_id: patientId,
                visit_date: record.date,
                visit_time: record.time,
                tooth_position: record.toothPos,
                description: record.desc,
                treatment_type: '复诊',
                status: '已完成',
                image_url: record.imageUrl
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            date: data.visit_date,
            time: data.visit_time,
            toothPos: data.tooth_position,
            desc: data.description,
            imageUrl: data.image_url
        };
    },

    // 更新诊疗记录
    async update(id: string, record: Partial<TreatmentRecord>): Promise<TreatmentRecord> {
        const { data, error } = await supabase
            .from('treatment_records')
            .update({
                visit_date: record.date,
                visit_time: record.time,
                tooth_position: record.toothPos,
                description: record.desc,
                image_url: record.imageUrl
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            date: data.visit_date,
            time: data.visit_time,
            toothPos: data.tooth_position,
            desc: data.description,
            imageUrl: data.image_url
        };
    },

    // 删除诊疗记录
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('treatment_records')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============= 预约管理 =============

export const appointmentsApi = {
    async getAll(): Promise<Appointment[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('appointment_time', { ascending: true });

        if (error) throw error;

        return (data || []).map(a => ({
            id: a.id,
            patientName: a.patient_name,
            phone: a.phone,
            type: a.appointment_type,
            time: new Date(a.appointment_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
            status: a.status
        }));
    },

    async create(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                patient_name: appointment.patientName,
                phone: appointment.phone,
                appointment_type: appointment.type,
                appointment_time: `${new Date().toISOString().split('T')[0]}T${appointment.time}:00`,
                status: appointment.status
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            patientName: data.patient_name,
            phone: data.phone,
            type: data.appointment_type,
            time: appointment.time,
            status: data.status
        };
    },

    async update(id: string, appointment: Partial<Appointment>): Promise<void> {
        const updates: any = {};
        if (appointment.patientName) updates.patient_name = appointment.patientName;
        if (appointment.phone) updates.phone = appointment.phone;
        if (appointment.type) updates.appointment_type = appointment.type;
        if (appointment.status) updates.status = appointment.status;

        const { error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============= 医疗物资管理 =============

export const medicinesApi = {
    async getAll(): Promise<Medicine[]> {
        const { data, error } = await supabase
            .from('medicines')
            .select('*')
            .order('expiry_date', { ascending: true });

        if (error) throw error;

        return (data || []).map(m => ({
            id: m.id,
            name: m.name,
            brand: m.brand,
            category: m.category,
            expiryDate: m.expiry_date,
            stock: m.stock,
            unit: m.unit,
            minStock: m.min_stock,
            status: m.status
        }));
    },

    async create(medicine: Omit<Medicine, 'id'>): Promise<Medicine> {
        // 计算状态
        const today = new Date();
        const expiryDate = new Date(medicine.expiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        let status: 'normal' | 'expired' | 'warning' = 'normal';
        if (diffDays < 0) status = 'expired';
        else if (diffDays < 90) status = 'warning';

        const { data, error } = await supabase
            .from('medicines')
            .insert([{
                name: medicine.name,
                brand: medicine.brand,
                category: medicine.category,
                expiry_date: medicine.expiryDate,
                stock: medicine.stock,
                unit: medicine.unit,
                min_stock: medicine.minStock,
                status
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            brand: data.brand,
            category: data.category,
            expiryDate: data.expiry_date,
            stock: data.stock,
            unit: data.unit,
            minStock: data.min_stock,
            status: data.status
        };
    },

    async update(id: string, medicine: Partial<Medicine>): Promise<void> {
        const updates: any = {};
        if (medicine.stock !== undefined) updates.stock = medicine.stock;
        if (medicine.minStock !== undefined) updates.min_stock = medicine.minStock;

        const { error } = await supabase
            .from('medicines')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('medicines')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============= 采购清单管理 =============

export const shoppingApi = {
    async getAll(): Promise<ShoppingItem[]> {
        const { data, error } = await supabase
            .from('shopping_items')
            .select('*')
            .order('added_date', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            name: s.name,
            quantity: s.quantity,
            isCustom: s.is_custom,
            isBought: s.is_bought,
            addedDate: s.added_date
        }));
    },

    async create(item: Omit<ShoppingItem, 'id'>): Promise<ShoppingItem> {
        const { data, error } = await supabase
            .from('shopping_items')
            .insert([{
                name: item.name,
                quantity: item.quantity,
                is_custom: item.isCustom,
                is_bought: item.isBought,
                added_date: item.addedDate
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            quantity: data.quantity,
            isCustom: data.is_custom,
            isBought: data.is_bought,
            addedDate: data.added_date
        };
    },

    async update(id: string, item: Partial<ShoppingItem>): Promise<void> {
        const updates: any = {};
        if (item.isBought !== undefined) updates.is_bought = item.isBought;

        const { error } = await supabase
            .from('shopping_items')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('shopping_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取所有患者
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取单个患者及其诊疗记录
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 获取患者基本信息
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (patientError) throw patientError;

        // 获取该患者的诊疗记录
        const { data: records, error: recordsError } = await supabase
            .from('treatment_records')
            .select('*')
            .eq('patient_id', id)
            .order('visit_date', { ascending: false });

        if (recordsError) throw recordsError;

        res.json({
            success: true,
            data: {
                ...patient,
                records: records || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建新患者
router.post('/', async (req, res) => {
    try {
        const patientData = req.body;

        const { data, error } = await supabase
            .from('patients')
            .insert([patientData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新患者信息
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('patients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 删除患者
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '患者已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;


/**
 * Holt die Klasse(n) eines Users basierend auf seiner Rolle
 * @param {string} userId - User ID
 * @param {string} role - 'student', 'teacher', 'parent'
 * @returns {Promise<Array>}
 */
export async function getUserClasses(supabase, userId, role) {
    if (role === 'student') {
        // Student: Direkt aus profiles.class_id
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                class_id,
                classes (
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('id', userId)
            .single();

        return profile?.classes ? [profile.classes] : [];
    }

    if (role === 'teacher') {
        // Lehrer: Über teacher_classes Tabelle
        const { data: teacherClasses } = await supabase
            .from('teacher_classes')
            .select(`
                classes (
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('teacher_id', userId);

        return teacherClasses?.map(tc => tc.classes) || [];
    }

    if (role === 'parent') {
        // Eltern: Über Kinder -> deren Klassen
        const { data: children } = await supabase
            .from('parent_children')
            .select(`
                profiles!child_id (
                    class_id,
                    classes (
                        id,
                        name,
                        grade_level
                    )
                )
            `)
            .eq('parent_id', userId);

        // Deduplizieren (falls mehrere Kinder in gleicher Klasse)
        const classMap = new Map();
        children?.forEach(child => {
            const cls = child.profiles?.classes;
            if (cls) {
                classMap.set(cls.id, cls);
            }
        });

        return Array.from(classMap.values());
    }

    return [];
}

/**
 * Holt alle Schüler, die ein User sehen darf
 * @param {string} userId - User ID
 * @param {string} role - 'student', 'teacher', 'parent', 'admin'
 * @returns {Promise<Array>}
 */
export async function getAccessibleStudents(supabase, userId, role) {
    if (role === 'admin') {
        // Admin sieht alle Schüler
        const { data } = await supabase
            .from('profiles')
            .select(`
                id,
                class_id,
                classes (
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('role', 'student');

        return data || [];
    }

    if (role === 'teacher') {
        // Lehrer sieht Schüler seiner Klassen
        const { data: teacherClasses } = await supabase
            .from('teacher_classes')
            .select('class_id')
            .eq('teacher_id', userId);

        const classIds = teacherClasses?.map(tc => tc.class_id) || [];

        if (classIds.length === 0) return [];

        const { data: students } = await supabase
            .from('profiles')
            .select(`
                id,
                class_id,
                classes (
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('role', 'student')
            .in('class_id', classIds);

        return students || [];
    }

    if (role === 'parent') {
        // Eltern sehen nur ihre Kinder
        const { data: children } = await supabase
            .from('parent_children')
            .select(`
                profiles!child_id (
                    id,
                    class_id,
                    classes (
                        id,
                        name,
                        grade_level
                    )
                )
            `)
            .eq('parent_id', userId);

        return children?.map(c => c.profiles) || [];
    }

    if (role === 'student') {
        // Schüler sehen nur sich selbst
        const { data } = await supabase
            .from('profiles')
            .select(`
                id,
                class_id,
                classes (
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('id', userId)
            .single();

        return data ? [data] : [];
    }

    return [];
}

/**
 * Weist einen Lehrer einer Klasse zu
 * @param {string} teacherId - Lehrer UUID
 * @param {number} classId - Klassen ID
 */
export async function assignTeacherToClass(supabase, teacherId, classId) {
    const { data, error } = await supabase
        .from('teacher_classes')
        .insert({ teacher_id: teacherId, class_id: classId })
        .select()
        .single();

    return { data, error };
}

/**
 * Entfernt einen Lehrer von einer Klasse
 * @param {string} teacherId - Lehrer UUID
 * @param {number} classId - Klassen ID
 */
export async function removeTeacherFromClass(supabase, teacherId, classId) {
    const { error } = await supabase
        .from('teacher_classes')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('class_id', classId);

    return { error };
}

/**
 * Verknüpft ein Elternteil mit einem Kind
 * @param {string} parentId - Eltern UUID
 * @param {string} childId - Kind UUID
 */
export async function linkParentToChild(supabase, parentId, childId) {
    const { data, error } = await supabase
        .from('parent_children')
        .insert({ parent_id: parentId, child_id: childId })
        .select()
        .single();

    return { data, error };
}

/**
 * Weist einen Schüler einer Klasse zu
 * @param {string} studentId - Schüler UUID
 * @param {number} classId - Klassen ID
 */
export async function assignStudentToClass(supabase, studentId, classId) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ class_id: classId })
        .eq('id', studentId)
        .select()
        .single();

    return { data, error };
}